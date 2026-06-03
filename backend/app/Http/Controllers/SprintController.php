<?php

namespace App\Http\Controllers;

use App\Http\Requests\Sprint\CreateSprintRequest;
use App\Http\Requests\Sprint\UpdateSprintRequest;
use App\Http\Requests\Sprint\CompleteSprintRequest;
use App\Http\Resources\SprintMetricResource;
use App\Http\Resources\SprintResource;
use App\Models\SprintMetric;
use App\Models\Task;
use App\Models\TimeEntry;
use App\Models\Sprint;
use App\Models\ActivityLog;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Str;

class SprintController extends Controller
{
    public function index(Request $request, string $workspaceId)
    {
        $sprints = Sprint::query()
            ->where('workspace_id', $workspaceId)
            ->when(
                $request->query('status'),
                fn ($query, $status) => $query->where('status', $status)
            )
            ->latest()
            ->paginate(15);

        return SprintResource::collection($sprints);
    }

    public function store(CreateSprintRequest $request, string $workspaceId)
    {
        Workspace::query()->findOrFail($workspaceId);

        $sprint = Sprint::create([
            ...$request->validated(),
            'workspace_id' => $workspaceId,
            'created_by' => auth()->id(),
            'status' => 'draft',
        ]);

        return (new SprintResource($sprint))
            ->response()
            ->setStatusCode(201);
    }

    public function active(string $workspaceId)
    {
        $sprint = Sprint::query()
            ->where('workspace_id', $workspaceId)
            ->where('status', 'active')
            ->first();

        return $sprint
            ? new SprintResource($sprint)
            : response()->json(['data' => null]);
    }

    public function show(string $workspaceId, string $id)
    {
        $sprint = $this->findSprintOrFail($workspaceId, $id);

        return new SprintResource($sprint);
    }

    public function update(
        UpdateSprintRequest $request,
        string $workspaceId,
        string $id
    ) {
        $sprint = $this->findSprintOrFail($workspaceId, $id);

        $sprint->update($request->validated());

        return new SprintResource($sprint->refresh());
    }

    public function start(string $workspaceId, string $id)
    {
        $result = DB::transaction(function () use ($workspaceId, $id) {
            $this->findWorkspaceOrFail($workspaceId, true);

            $sprint = $this->findSprintOrFail($workspaceId, $id);

            if ($sprint->status !== 'draft') {
                return response()->json([
                    'message' => 'Apenas sprints em rascunho podem ser iniciados.',
                ], 409);
            }

            $hasActiveSprint = Sprint::query()
                ->where('workspace_id', $workspaceId)
                ->where('status', 'active')
                ->exists();

            if ($hasActiveSprint) {
                return response()->json([
                    'message' => 'Já existe um sprint ativo neste workspace.',
                ], 409);
            }

            $sprint->update([
                'status' => 'active',
                'started_at' => now(),
            ]);

            ActivityLog::create([
                'workspace_id' => $workspaceId,
                'actor_id' => auth()->id(),
                'action' => 'sprint.started',
                'entity_type' => 'sprint',
                'entity_id' => $sprint->id,
                'old_value' => ['status' => 'draft'],
                'new_value' => ['status' => 'active'],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            return new SprintResource($sprint->refresh());
        });

        return $result;
    }

    public function complete(
        CompleteSprintRequest $request,
        string $workspaceId,
        string $id
    ) {
        $metric = DB::transaction(function () use ($request, $workspaceId, $id) {
            $sprint = $this->findSprintOrFail($workspaceId, $id, true);

            if ($sprint->status !== 'active') {
                throw new HttpResponseException(
                    response()->json([
                        'message' => 'Apenas sprints ativos podem ser encerrados.',
                    ], 409)
                );
            }

            $tasks = Task::query()
                ->where('workspace_id', $workspaceId)
                ->where('sprint_id', $sprint->id)
                ->get();

            $taskIds = $tasks->pluck('id');
            $planned = $tasks->count();
            $completed = $tasks->where('status', 'done')->count();
            $carriedOver = $tasks
                ->whereNotIn('status', ['done', 'cancelled'])
                ->count();

            $timeLogged = TimeEntry::query()
                ->where('workspace_id', $workspaceId)
                ->whereIn('task_id', $taskIds)
                ->sum('duration_seconds');

            $completionRate = $planned > 0
                ? (int) round(($completed / $planned) * 100)
                : 0;

            $metric = SprintMetric::create([
                'sprint_id' => $sprint->id,
                'total_tasks_planned' => $planned,
                'total_tasks_completed' => $completed,
                'total_tasks_carried_over' => $carriedOver,
                'total_time_logged_seconds' => $timeLogged,
                'completion_rate' => $completionRate,
                'members_snapshot' => [],
            ]);

            Task::query()
                ->where('workspace_id', $workspaceId)
                ->where('sprint_id', $sprint->id)
                ->whereNotIn('status', ['done', 'cancelled'])
                ->update(['sprint_id' => null]);

            $sprint->update([
                'status' => 'completed',
                'completed_at' => now(),
                'retrospective_notes' => $request->validated('retrospective_notes'),
            ]);

            ActivityLog::create([
                'workspace_id' => $workspaceId,
                'actor_id' => auth()->id(),
                'action' => 'sprint.completed',
                'entity_type' => 'sprint',
                'entity_id' => $sprint->id,
                'old_value' => ['status' => 'active'],
                'new_value' => ['status' => 'completed'],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            return $metric;
        });

        return new SprintMetricResource($metric->refresh());
    }

    public function metrics(string $workspaceId, string $id)
    {
        $sprint = $this->findSprintOrFail($workspaceId, $id);

        $metric = SprintMetric::query()
            ->where('sprint_id', $sprint->id)
            ->firstOrFail();

        return new SprintMetricResource($metric);
    }

    public function cancel(string $workspaceId, string $id)
    {
        DB::transaction(function () use ($workspaceId, $id) {
            $sprint = $this->findSprintOrFail($workspaceId, $id, true);

            if (! in_array($sprint->status, ['draft', 'active'], true)) {
                throw new HttpResponseException(
                    response()->json([
                        'message' => 'Este sprint não pode ser cancelado.',
                    ], 409)
                );
            }

            Task::query()
                ->where('workspace_id', $workspaceId)
                ->where('sprint_id', $sprint->id)
                ->update(['sprint_id' => null]);

            $sprint->update(['status' => 'cancelled']);
        });

        return response()->noContent();
    }

    private function findWorkspaceOrFail(string $workspaceId, bool $lockForUpdate = false): Workspace
    {
        abort_unless(Str::isUuid($workspaceId), 404);

        $query = Workspace::query()->whereKey($workspaceId);

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        return $query->firstOrFail();
    }

    private function findSprintOrFail(
        string $workspaceId,
        string $id,
        bool $lockForUpdate = false
    ): Sprint {
        abort_unless(Str::isUuid($workspaceId) && Str::isUuid($id), 404);

        $query = Sprint::query()
            ->where('workspace_id', $workspaceId);

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        return $query->findOrFail($id);
    }
}
