<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SprintResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workspace_id' => $this->workspace_id,
            'name' => $this->name,
            'status' => $this->status,
            'goal' => $this->goal,
            'capacity_hours' => $this->capacity_hours,
            'started_at' => $this->started_at,
            'ends_at' => $this->ends_at,
            'completed_at' => $this->completed_at,
            'created_by' => $this->created_by,
            'retrospective_notes' => $this->retrospective_notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}