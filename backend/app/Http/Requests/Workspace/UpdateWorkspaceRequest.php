<?php

namespace App\Http\Requests\Workspace;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkspaceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => 'nullable|string|max:100',
            'slug' => 'nullable|string|max:60|regex:/^[a-z0-9-]+$/',
            'sprint_duration_days' => 'nullable|integer|in:7,14,30',
            'timezone' => 'nullable|string|timezone',
        ];
    }
}
