<?php

namespace App\Http\Requests\Workspace;

use Illuminate\Foundation\Http\FormRequest;

class CreateWorkspaceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:60|regex:/^[a-z0-9-]+$/',
            'sprint_duration_days' => 'nullable|integer|in:7,14,30',
            'timezone' => 'nullable|string|timezone',
        ];
    }
}
