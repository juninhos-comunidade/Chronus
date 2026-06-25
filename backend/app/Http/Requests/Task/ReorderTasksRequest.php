<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;

class ReorderTasksRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tasks' => 'required|array|min:1',
            'tasks.*.id' => 'required|uuid|exists:tasks,id',
            'tasks.*.position' => 'required|numeric',
        ];
    }
}
