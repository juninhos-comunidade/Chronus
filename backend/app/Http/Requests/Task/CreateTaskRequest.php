<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;

class CreateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'nullable|in:urgent,high,medium,low',
            'assignee_id' => 'nullable|exists:users,id',
            'sprint_id' => 'nullable|exists:sprints,id',
            'estimated_minutes' => 'nullable|integer|min:1',
            'due_date' => 'nullable|date|after:today',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ];
    }
}
