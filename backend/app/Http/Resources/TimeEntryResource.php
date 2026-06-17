<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TimeEntryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'workspace_id' => $this->workspace_id,
            'task_id' => $this->task_id,
            'type' => $this->type,
            'notes' => $this->notes,
            'pomodoro_count' => $this->pomodoro_count,
            
            'started_at' => $this->started_at ? $this->started_at->toIso8601String() : null,
            'ended_at' => $this->ended_at ? $this->ended_at->toIso8601String() : null,
            'duration_seconds' => $this->duration_seconds,
            'elapsed_seconds' => $this->when(isset($his->elapsed_seconds), $this->elapsed_seconds),
            
            'task' => $this->whenLoaded('task'),

        ];
    }
}
