<?php

namespace App\Http\Controllers;

use App\Http\Resources\TaskHistoryResource;
use App\Models\Task;
use App\Models\TaskHistory;
use Illuminate\Support\Str;

class TaskHistoryController extends Controller
{
    public function index(string $workspaceId, string $id)
    {
        $task = $this->findTaskOrFail($workspaceId, $id);

        $history = TaskHistory::query()
            ->with('changer')
            ->where('task_id', $task->id)
            ->orderByDesc('changed_at')
            ->get();

        return TaskHistoryResource::collection($history);
    }

    private function findTaskOrFail(string $workspaceId, string $id): Task
    {
        abort_unless(Str::isUuid($workspaceId) && Str::isUuid($id), 404);

        return Task::query()
            ->where('workspace_id', $workspaceId)
            ->findOrFail($id);
    }
}
