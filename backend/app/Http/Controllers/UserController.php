<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;

class UserController extends Controller
{
    public function showMe(Request $request)
    {
        return new UserResource($request->user());
    }

    public function updateMe(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $user->update($request->validated());
        
        return new UserResource($user);
    }

    public function destroyMe(Request $request)
    {
        $user = $request->user();
        $user->delete();
        $user->tokens()->delete();

        return response()->json(null, 204);
    }
}
