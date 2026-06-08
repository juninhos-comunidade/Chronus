<?php

namespace App\Http\Controllers;

use App\Http\Requests\Task\CreateTaskRequest;
use App\Http\Requests\Task\BlockTaskRequest;
use App\Http\Requests\Task\MoveTaskRequest;
use App\Http\Requests\Task\ReorderTasksRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Http\Requests\Task\UpdateTaskStatusRequest;
use App\Http\Resources\TaskResource;
use App\Models\Sprint;
use App\Models\Task;
use App\Models\TaskHistory;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TaskController extends Controller
{
    public function index(Request $request, string $workspaceId)
    {
        abort_unless(Str::isUuid($workspaceId), 404);

        $tasks = Task::query()
            ->with('assignee')
            ->where('workspace_id', $workspaceId)
            ->when($request->query('sprint_id'), fn ($query, $sprintId) => $query->where('sprint_id', $sprintId))
            ->when($request->query('status'), fn ($query, $status) => $query->where('status', $status))
            ->when($request->query('assignee_id'), fn ($query, $assigneeId) => $query->where('assignee_id', $assigneeId))
            ->when($request->query('priority'), fn ($query, $priority) => $query->where('priority', $priority))
            ->when($request->has('is_blocked'), fn ($query) => $query->where('is_blocked', $request->boolean('is_blocked')))
            ->orderBy('position')
            ->paginate(20);

        return TaskResource::collection($tasks);
    }

    public function backlog(string $workspaceId)
    {
        abort_unless(Str::isUuid($workspaceId), 404);

        $tasks = Task::query()
            ->with('assignee')
            ->where('workspace_id', $workspaceId)
            ->whereNull('sprint_id')
            ->orderBy('position')
            ->paginate(20);

        return TaskResource::collection($tasks);
    }

    public function store(CreateTaskRequest $request, string $workspaceId)
    {
        abort_unless(Str::isUuid($workspaceId), 404);

        Workspace::query()->findOrFail($workspaceId);

        $data = $request->validated();
        $sprintId = $data['sprint_id'] ?? null;

        if ($sprintId !== null) {
            $this->findOpenSprintOrFail($workspaceId, $sprintId);
        }

        $task = DB::transaction(function () use ($data, $workspaceId, $sprintId) {
            $position = ((float) Task::query()
                ->where('workspace_id', $workspaceId)
                ->where('sprint_id', $sprintId)
                ->max('position')) + 1;

            $task = Task::create([
                ...$data,
                'workspace_id' => $workspaceId,
                'created_by' => auth()->id(),
                'status' => $sprintId === null ? 'backlog' : 'todo',
                'position' => $position,
            ]);

            TaskHistory::create([
                'task_id' => $task->id,
                'changed_by' => auth()->id() ?? $task->created_by,
                'field' => 'created',
                'new_value' => [
                    'title' => $task->title,
                    'status' => $task->status,
                ],
            ]);

            return $task;
        });

        return (new TaskResource($task->load('assignee')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(string $workspaceId, string $id)
    {
        $task = $this->findTaskOrFail($workspaceId, $id)
            ->load(['assignee', 'creator']);

        return new TaskResource($task);
    }

    public function update(
        UpdateTaskRequest $request,
        string $workspaceId,
        string $id
    ) {
        $task = DB::transaction(function () use ($request, $workspaceId, $id) {
            $task = $this->findTaskOrFail($workspaceId, $id);
            $data = $request->validated();

            if (array_key_exists('sprint_id', $data) && $data['sprint_id'] !== null) {
                $this->findOpenSprintOrFail($workspaceId, $data['sprint_id']);
            }

            foreach ($data as $field => $newValue) {
                $oldValue = $task->{$field};

                if ($oldValue == $newValue) {
                    continue;
                }

                TaskHistory::create([
                    'task_id' => $task->id,
                    'changed_by' => auth()->id() ?? $task->created_by,
                    'field' => $field,
                    'old_value' => [$field => $oldValue],
                    'new_value' => [$field => $newValue],
                ]);
            }

            $task->update($data);

            return $task;
        });

        return new TaskResource($task->refresh()->load('assignee'));
    }

    public function destroy(string $workspaceId, string $id)
    {
        $task = $this->findTaskOrFail($workspaceId, $id);
        $task->delete();

        return response()->noContent();
    }

    public function updateStatus(
        UpdateTaskStatusRequest $request,
        string $workspaceId,
        string $id
    ) {
        $task = DB::transaction(function () use ($request, $workspaceId, $id) {
            $task = $this->findTaskOrFail($workspaceId, $id);
            $oldStatus = $task->status;
            $newStatus = $request->validated('status');

            if ($oldStatus === $newStatus) {
                return $task;
            }

            $task->update(['status' => $newStatus]);

            TaskHistory::create([
                'task_id' => $task->id,
                'changed_by' => auth()->id() ?? $task->created_by,
                'field' => 'status',
                'old_value' => ['status' => $oldStatus],
                'new_value' => ['status' => $newStatus],
            ]);

            return $task;
        });

        return new TaskResource($task->refresh()->load('assignee'));
    }

    public function block(
        BlockTaskRequest $request,
        string $workspaceId,
        string $id
    ) {
        $task = DB::transaction(function () use ($request, $workspaceId, $id) {
            $task = $this->findTaskOrFail($workspaceId, $id);
            $reason = $request->validated('reason');

            $task->update([
                'is_blocked' => true,
                'blocked_reason' => $reason,
                'blocked_since' => now(),
            ]);

            TaskHistory::create([
                'task_id' => $task->id,
                'changed_by' => auth()->id() ?? $task->created_by,
                'field' => 'blocked',
                'old_value' => [
                    'is_blocked' => false,
                    'blocked_reason' => null,
                ],
                'new_value' => [
                    'is_blocked' => true,
                    'blocked_reason' => $reason,
                ],
            ]);

            return $task;
        });

        return new TaskResource($task->refresh()->load('assignee'));
    }

    public function unblock(string $workspaceId, string $id)
    {
        $task = DB::transaction(function () use ($workspaceId, $id) {
            $task = $this->findTaskOrFail($workspaceId, $id);

            $oldReason = $task->blocked_reason;

            $task->update([
                'is_blocked' => false,
                'blocked_reason' => null,
                'blocked_since' => null,
            ]);

            TaskHistory::create([
                'task_id' => $task->id,
                'changed_by' => auth()->id() ?? $task->created_by,
                'field' => 'unblocked',
                'old_value' => [
                    'is_blocked' => true,
                    'blocked_reason' => $oldReason,
                ],
                'new_value' => [
                    'is_blocked' => false,
                    'blocked_reason' => null,
                ],
            ]);

            return $task;
        });

        return new TaskResource($task->refresh()->load('assignee'));
    }

    public function move(
        MoveTaskRequest $request,
        string $workspaceId,
        string $id
    ) {
        $task = DB::transaction(function () use ($request, $workspaceId, $id) {
            $task = $this->findTaskOrFail($workspaceId, $id);
            $oldSprintId = $task->sprint_id;
            $newSprintId = $request->validated('sprint_id');

            if ($newSprintId !== null) {
                $this->findOpenSprintOrFail($workspaceId, $newSprintId);
            }

            if ($oldSprintId === $newSprintId) {
                return $task;
            }

            $oldStatus = $task->status;
            $newStatus = $newSprintId === null
                ? 'backlog'
                : ($task->status === 'backlog' ? 'todo' : $task->status);

            $position = ((float) Task::query()
                ->where('workspace_id', $workspaceId)
                ->where('sprint_id', $newSprintId)
                ->max('position')) + 1;

            $task->update([
                'sprint_id' => $newSprintId,
                'status' => $newStatus,
                'position' => $position,
            ]);

            TaskHistory::create([
                'task_id' => $task->id,
                'changed_by' => auth()->id() ?? $task->created_by,
                'field' => 'sprint_id',
                'old_value' => ['sprint_id' => $oldSprintId],
                'new_value' => ['sprint_id' => $newSprintId],
            ]);

            if ($oldStatus !== $newStatus) {
                TaskHistory::create([
                    'task_id' => $task->id,
                    'changed_by' => auth()->id() ?? $task->created_by,
                    'field' => 'status',
                    'old_value' => ['status' => $oldStatus],
                    'new_value' => ['status' => $newStatus],
                ]);
            }

            return $task;
        });

        return new TaskResource($task->refresh()->load('assignee'));
    }

    public function reorder(ReorderTasksRequest $request, string $workspaceId)
    {
        abort_unless(Str::isUuid($workspaceId), 404);

        DB::transaction(function () use ($request, $workspaceId) {
            foreach ($request->validated('tasks') as $item) {
                Task::query()
                    ->where('workspace_id', $workspaceId)
                    ->where('id', $item['id'])
                    ->update(['position' => $item['position']]);
            }
        });

        return response()->noContent();
    }

    private function findTaskOrFail(string $workspaceId, string $id): Task
    {
        abort_unless(Str::isUuid($workspaceId) && Str::isUuid($id), 404);

        return Task::query()
            ->where('workspace_id', $workspaceId)
            ->findOrFail($id);
    }

    private function findOpenSprintOrFail(string $workspaceId, string $sprintId): Sprint
    {
        abort_unless(Str::isUuid($workspaceId) && Str::isUuid($sprintId), 404);

        return Sprint::query()
            ->where('workspace_id', $workspaceId)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->findOrFail($sprintId);
    }
}
