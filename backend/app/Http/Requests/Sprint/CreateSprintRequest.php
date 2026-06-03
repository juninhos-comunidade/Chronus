<?php

namespace App\Http\Requests\Sprint;

use Illuminate\Foundation\Http\FormRequest;

class CreateSprintRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:150',
            'goal' => 'nullable|string',
            'capacity_hours' => 'nullable|integer|min:1',
            'started_at' => 'nullable|date',
            'ends_at' => 'nullable|date|after:started_at',
        ];
    }
}