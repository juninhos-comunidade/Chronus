<?php

namespace App\Http\Controllers;

use App\Http\Resources\WorkspaceMemberResource;
use App\Models\WorkspaceMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkspaceMemberController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $member = $request->workspaceMember;
        $members = WorkspaceMember::with('user')
            ->where('workspace_id', $member->workspace_id)
            ->get();

        return response()->json([
            'data' => WorkspaceMemberResource::collection($members),
        ]);
    }

    public function updateRole(Request $request): JsonResponse
    {
        $member = $request->workspaceMember;

        if ($member->role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $userId = $request->route('userId');
        $target = WorkspaceMember::where('workspace_id', $member->workspace_id)
            ->where('user_id', $userId)
            ->firstOrFail();

        $workspace = $member->workspace;

        if ($workspace->owner_id === $userId) {
            return response()->json(['message' => 'Cannot change owner role.'], 403);
        }

        $validated = $request->validate([
            'role' => 'required|in:admin,lead,member',
        ]);

        $target->update(['role' => $validated['role']]);

        return response()->json([
            'data' => new WorkspaceMemberResource($target->fresh()->load('user')),
        ]);
    }

    public function remove(Request $request): JsonResponse
    {
        $member = $request->workspaceMember;

        $canRemove = $member->role === 'admin' || $member->role === 'lead';
        if (!$canRemove) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $userId = $request->route('userId');

        if ($request->workspaceMember->workspace->owner_id === $userId) {
            return response()->json(['message' => 'Cannot remove the owner.'], 403);
        }

        $target = WorkspaceMember::where('workspace_id', $member->workspace_id)
            ->where('user_id', $userId)
            ->firstOrFail();

        $target->delete();

        return response()->json(null, 204);
    }
}
