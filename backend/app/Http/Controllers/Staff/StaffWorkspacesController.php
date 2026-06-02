<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Http\Resources\WorkspaceResource;
use App\Models\ActivityLog;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffWorkspacesController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Workspace::query()->with('owner');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $workspaces = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'data' => WorkspaceResource::collection($workspaces),
            'meta' => [
                'total' => $workspaces->total(),
                'per_page' => $workspaces->perPage(),
                'current_page' => $workspaces->currentPage(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $workspace = Workspace::with('owner', 'members')->findOrFail($id);

        return response()->json([
            'data' => new WorkspaceResource($workspace),
        ]);
    }

    public function suspend(Request $request, string $id): JsonResponse
    {
        $request->validate(['reason' => 'nullable|string|max:500']);

        $workspace = Workspace::findOrFail($id);
        $workspace->update(['status' => 'suspended']);

        ActivityLog::create([
            'workspace_id' => $workspace->id,
            'actor_staff_id' => $request->staffUser->id,
            'action' => 'workspace.suspended',
            'entity_type' => 'workspace',
            'entity_id' => $workspace->id,
            'new_value' => ['reason' => $request->reason],
        ]);

        return response()->json(null, 204);
    }

    public function reactivate(Request $request, string $id): JsonResponse
    {
        $workspace = Workspace::findOrFail($id);
        $workspace->update(['status' => 'active']);

        ActivityLog::create([
            'workspace_id' => $workspace->id,
            'actor_staff_id' => $request->staffUser->id,
            'action' => 'workspace.reactivated',
            'entity_type' => 'workspace',
            'entity_id' => $workspace->id,
        ]);

        return response()->json(null, 204);
    }
}
