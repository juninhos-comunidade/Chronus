<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SprintMetricResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sprint_id' => $this->sprint_id,
            'total_tasks_planned' => $this->total_tasks_planned,
            'total_tasks_completed' => $this->total_tasks_completed,
            'total_tasks_carried_over' => $this->total_tasks_carried_over,
            'total_time_logged_seconds' => $this->total_time_logged_seconds,
            'completion_rate' => $this->completion_rate,
            'members_snapshot' => $this->members_snapshot ?? [],
            'created_at' => $this->created_at,
        ];
    }
}