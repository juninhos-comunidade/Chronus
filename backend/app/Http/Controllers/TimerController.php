<?php

namespace App\Http\Controllers;

use App\Events\TimerStarted;
use App\Events\TimerStopped;
use App\Events\PomodoroCompleted;
use App\Http\Requests\Timer\StartTimerRequest;
use App\Http\Requests\Timer\StopTimerRequest;
use App\Http\Requests\Timer\CreateManualEntryRequest;
use App\Http\Resources\TimeEntryResource;
use App\Models\TimeEntry;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;
use Carbon\Carbon;

class TimerController extends Controller
{
    public function getActive(int $workspaceId)
    {
        $entry = TimeEntry::where('user_id', Auth::id())
            ->where('workspace_id', $workspaceId)
            ->whereNull('ended_at')
            ->with('task')
            ->first();

        if (!$entry) {
            return response()->json(['data' => null]);
        }

        $entry->elapsed_seconds = now()->diffInSeconds($entry->started_at);

        return new TimeEntryResource($entry);
    }

    public function start(StartTimerRequest $request, int $workspaceId)
    {
        $userId = Auth::id();
        $taskId = $request->task_id;

        $task = Task::where('id', $taskId)->where('workspace_id', $workspaceId)->first();
        if (!$task) {
            return response()->json(['error' => 'not_found'], Response::HTTP_NOT_FOUND);
        }

        $hasActive = TimeEntry::where('user_id', $userId)->whereNull('ended_at')->exists();
        if ($hasActive) {
            return response()->json(['error' => 'business: timer_already_active'], Response::HTTP_CONFLICT);
        }

        $entry = TimeEntry::create([
            'user_id' => $userId,
            'workspace_id' => $workspaceId,
            'task_id' => $taskId,
            'type' => $request->type ?? 'timer',
            'notes' => $request->notes,
            'started_at' => now(),
        ]);

        TimerStarted::dispatch($entry);

        return response()->json(new TimeEntryResource($entry), Response::HTTP_CREATED);
    }

    public function stop(StopTimerRequest $request, int $workspaceId)
    {
        $entry = TimeEntry::where('user_id', Auth::id())
            ->where('workspace_id', $workspaceId)
            ->whereNull('ended_at')
            ->firstOrFail(); 

        $duration = now()->diffInSeconds($entry->started_at);

        DB::transaction(function () use ($entry, $duration, $request) {
            $entry->update([
                'ended_at' => now(),
                'duration_seconds' => $duration,
                'notes' => $request->notes ?? $entry->notes
            ]);

            $this->recalculateTaskMinutes($entry->task_id);
        });

        TimerStopped::dispatch($entry, $duration);

        return new TimeEntryResource($entry->fresh());
    }

    public function completePomodoroRound(int $workspaceId)
    {
        $entry = TimeEntry::where('user_id', Auth::id())
            ->where('workspace_id', $workspaceId)
            ->whereNull('ended_at')
            ->where('type', 'pomodoro')
            ->first();

        if (!$entry) {
            return response()->json(['error' => 'business: no_active_pomodoro'], Response::HTTP_BAD_REQUEST);
        }

        DB::transaction(function () use ($entry) {
            $entry->increment('pomodoro_count');
        });

        PomodoroCompleted::dispatch($entry);

        return new TimeEntryResource($entry->fresh());
    }

    public function storeManual(CreateManualEntryRequest $request, int $workspaceId)
    {
        $startedAt = Carbon::parse($request->started_at);
        $endedAt = Carbon::parse($request->ended_at);
        $duration = $endedAt->diffInSeconds($startedAt);

        $entry = DB::transaction(function () use ($request, $workspaceId, $startedAt, $endedAt, $duration) {
            $newEntry = TimeEntry::create([
                'user_id' => Auth::id(),
                'workspace_id' => $workspaceId,
                'task_id' => $request->task_id,
                'type' => 'manual',
                'notes' => $request->notes,
                'started_at' => $startedAt,
                'ended_at' => $endedAt,
                'duration_seconds' => $duration,
            ]);

            $this->recalculateTaskMinutes($request->task_id);

            return $newEntry;
        });

        return response()->json(new TimeEntryResource($entry), Response::HTTP_CREATED);
    }

    public function index(Request $request, int $workspaceId)
    {
        $query = TimeEntry::where('user_id', Auth::id())
            ->where('workspace_id', $workspaceId);

        if ($request->has('from')) {
            $query->where('started_at', '>=', Carbon::parse($request->from));
        }
        if ($request->has('to')) {
            $query->where('started_at', '<=', Carbon::parse($request->to));
        }

        return TimeEntryResource::collection($query->latest('started_at')->paginate(20));
    }

    public function taskEntries(int $workspaceId, int $taskId)
    {
        $entries = TimeEntry::where('task_id', $taskId)
            ->latest('started_at')
            ->paginate(20);

        return TimeEntryResource::collection($entries);
    }

    public function destroy(int $workspaceId, int $id)
    {
        $entry = TimeEntry::findOrFail($id);

        if ($entry->user_id !== Auth::id()) {
            return response()->json(['error' => 'forbidden'], Response::HTTP_FORBIDDEN);
        }

        if ($entry->ended_at === null) {
            return response()->json(['error' => 'timer_still_active'], Response::HTTP_CONFLICT);
        }

        DB::transaction(function () use ($entry) {
            $taskId = $entry->task_id;
            $entry->delete();
            $this->recalculateTaskMinutes($taskId);
        });

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }


    private function recalculateTaskMinutes(int $taskId): void
    {
        $totalSeconds = TimeEntry::where('task_id', $taskId)
            ->whereNotNull('ended_at')
            ->sum('duration_seconds');

        $actualMinutes = (int) floor($totalSeconds / 60);

        Task::where('id', $taskId)->update(['actual_minutes' => $actualMinutes]);
    }
}