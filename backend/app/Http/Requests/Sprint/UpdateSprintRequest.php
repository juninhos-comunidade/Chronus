<?php

namespace App\Http\Requests\Sprint;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSprintRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:150',
            'goal' => 'sometimes|nullable|string',
            'capacity_hours' => 'sometimes|nullable|integer|min:1',
            'started_at' => 'sometimes|nullable|date',
            'ends_at' => 'sometimes|nullable|date|after:started_at',
        ];
    }
}