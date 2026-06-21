<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PomodoroCompleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $entryId;
    public int $taskId;
    public int $userId;
    public int $workspaceId;
    public int $pomodoroCount;

    public function __construct($entry)
    {
        $this->entryId = $entry->id;
        $this->taskId = $entry->task_id;
        $this->userId = $entry->user_id;
        $this->workspaceId = $entry->workspace_id;
        $this->pomodoroCount = $entry->pomodoro_count;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('channel-name'),
        ];
    }
}
