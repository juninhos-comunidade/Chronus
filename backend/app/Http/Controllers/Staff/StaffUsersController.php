<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffUsersController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'data' => UserResource::collection($users),
            'meta' => [
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        return response()->json([
            'data' => new UserResource($user),
        ]);
    }

    public function ban(Request $request, string $id): JsonResponse
    {
        $request->validate(['reason' => 'nullable|string|max:500']);

        $user = User::findOrFail($id);
        $user->update(['status' => 'banned']);

        ActivityLog::create([
            'actor_staff_id' => $request->staffUser->id,
            'action' => 'user.banned',
            'entity_type' => 'user',
            'entity_id' => $user->id,
            'new_value' => ['reason' => $request->reason],
        ]);

        return response()->json(null, 204);
    }

    public function unban(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update(['status' => 'active']);

        return response()->json(null, 204);
    }
}
