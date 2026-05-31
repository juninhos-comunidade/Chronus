<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workspace_id' => $this->workspace_id,
            'sprint_id' => $this->sprint_id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'assignee' => $this->whenLoaded('assignee', fn () => [
                'id' => $this->assignee?->id,
                'name' => $this->assignee?->name,
                'avatar' => $this->assignee?->avatar,
            ]),
            'created_by' => $this->created_by,
            'estimated_minutes' => $this->estimated_minutes,
            'actual_minutes' => $this->actual_minutes,
            'due_date' => $this->due_date,
            'tags' => $this->tags ?? [],
            'position' => $this->position,
            'is_blocked' => $this->is_blocked,
            'blocked_reason' => $this->blocked_reason,
            'blocked_since' => $this->blocked_since,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}