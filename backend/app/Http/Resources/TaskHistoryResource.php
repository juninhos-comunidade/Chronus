<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'task_id' => $this->task_id,
            'changed_by' => $this->changed_by,
            'changer' => $this->whenLoaded('changer', fn () => [
                'id' => $this->changer->id,
                'name' => $this->changer->name,
                'avatar' => $this->changer->avatar,
            ]),
            'field' => $this->field,
            'old_value' => $this->old_value,
            'new_value' => $this->new_value,
            'changed_at' => $this->changed_at,
        ];
    }
}