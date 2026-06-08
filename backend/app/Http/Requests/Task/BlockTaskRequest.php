<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;

class BlockTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => 'required|string|max:1000',
        ];
    }
}
