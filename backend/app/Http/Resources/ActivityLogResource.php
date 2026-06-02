<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workspace_id' => $this->workspace_id,
            'action' => $this->action,
            'entity_type' => $this->entity_type,
            'entity_id' => $this->entity_id,
            'old_value' => $this->old_value,
            'new_value' => $this->new_value,
            'metadata' => $this->metadata,
            'actor' => $this->whenLoaded('actor', fn() => [
                'id' => $this->actor->id,
                'name' => $this->actor->name,
                'avatar' => $this->actor->avatar,
            ]),
            'actor_staff_id' => $this->actor_staff_id,
            'created_at' => $this->created_at,
        ];
    }
}
