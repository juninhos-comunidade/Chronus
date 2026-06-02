<?php

namespace App\Http\Controllers;

use App\Http\Requests\Workspace\CreateWorkspaceRequest;
use App\Http\Requests\Workspace\UpdateWorkspaceRequest;
use App\Http\Resources\WorkspaceResource;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkspaceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $workspaces = $request->user()->workspaces()->get();

        return response()->json([
            'data' => WorkspaceResource::collection($workspaces),
        ]);
    }

    public function store(CreateWorkspaceRequest $request): JsonResponse
    {
        $slugExists = Workspace::where('slug', $request->slug)->exists();

        if ($slugExists) {
            return response()->json(['message' => 'Slug already taken.'], 409);
        }

        $workspace = DB::transaction(function () use ($request) {
            $data = [
                'name' => $request->name,
                'slug' => $request->slug,
                'owner_id' => $request->user()->id,
                'status' => 'active',
            ];

            if ($request->has('sprint_duration_days')) {
                $data['sprint_duration_days'] = $request->sprint_duration_days;
            }

            if ($request->has('timezone')) {
                $data['timezone'] = $request->timezone;
            }

            $workspace = Workspace::create($data);

            WorkspaceMember::create([
                'workspace_id' => $workspace->id,
                'user_id' => $request->user()->id,
                'role' => 'admin',
                'status' => 'active',
                'joined_at' => now(),
            ]);

            return $workspace;
        });

        return response()->json([
            'data' => new WorkspaceResource($workspace),
        ], 201);
    }

    public function show(Request $request): JsonResponse
    {
        $workspace = $request->workspaceMember->workspace;
        $workspace->load('owner');

        return response()->json([
            'data' => new WorkspaceResource($workspace),
        ]);
    }

    public function update(UpdateWorkspaceRequest $request): JsonResponse
    {
        $member = $request->workspaceMember;

        if ($member->role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $workspace = $member->workspace;
        $workspace->update($request->validated());

        return response()->json([
            'data' => new WorkspaceResource($workspace->fresh()),
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $member = $request->workspaceMember;
        $workspace = $member->workspace;

        if ($workspace->owner_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $workspace->delete();

        return response()->json(null, 204);
    }

    public function leave(Request $request): JsonResponse
    {
        $member = $request->workspaceMember;
        $workspace = $member->workspace;

        if ($workspace->owner_id === $request->user()->id) {
            return response()->json(['message' => 'Owner cannot leave the workspace.'], 403);
        }

        $member->delete();

        return response()->json(null, 204);
    }
}
