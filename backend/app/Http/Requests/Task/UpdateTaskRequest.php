<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'priority' => 'sometimes|in:urgent,high,medium,low',
            'assignee_id' => 'sometimes|nullable|exists:users,id',
            'sprint_id' => 'sometimes|nullable|exists:sprints,id',
            'estimated_minutes' => 'sometimes|nullable|integer|min:1',
            'due_date' => 'sometimes|nullable|date|after:today',
            'tags' => 'sometimes|nullable|array',
            'tags.*' => 'string|max:50',
            'position' => 'sometimes|numeric',
        ];
    }
}
