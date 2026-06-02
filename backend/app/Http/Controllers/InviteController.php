<?php

namespace App\Http\Controllers;

use App\Http\Requests\Workspace\InviteMemberRequest;
use App\Http\Resources\InviteResource;
use App\Http\Resources\WorkspaceMemberResource;
use App\Models\Invite;
use App\Models\WorkspaceMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InviteController extends Controller
{
    public function store(InviteMemberRequest $request): JsonResponse
    {
        $member = $request->workspaceMember;

        if (!in_array($member->role, ['admin', 'lead'])) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $emailHash = hash('sha256', strtolower($request->email));

        $existingMember = WorkspaceMember::whereHas('user', function ($q) use ($emailHash) {
            $q->where('email_hash', $emailHash);
        })->where('workspace_id', $member->workspace_id)->exists();

        if ($existingMember) {
            return response()->json(['message' => 'User is already a member.'], 409);
        }

        $pendingInvite = Invite::where('workspace_id', $member->workspace_id)
            ->where('email', $request->email)
            ->whereNull('accepted_at')
            ->exists();

        if ($pendingInvite) {
            return response()->json(['message' => 'Invite already sent.'], 409);
        }

        $invite = Invite::create([
            'workspace_id' => $member->workspace_id,
            'email' => $request->email,
            'role' => $request->role ?? 'member',
            'token' => Str::random(64),
            'invited_by' => $request->user()->id,
            'expires_at' => now()->addHours(72),
        ]);

        return response()->json([
            'data' => new InviteResource($invite),
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $member = $request->workspaceMember;

        if ($member->role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $invites = Invite::where('workspace_id', $member->workspace_id)
            ->whereNull('accepted_at')
            ->get();

        return response()->json([
            'data' => InviteResource::collection($invites),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $member = $request->workspaceMember;

        if ($member->role !== 'admin') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $invite = Invite::where('id', $id)
            ->where('workspace_id', $member->workspace_id)
            ->firstOrFail();

        $invite->delete();

        return response()->json(null, 204);
    }

    public function accept(Request $request, string $token): JsonResponse
    {
        $invite = Invite::where('token', $token)->firstOrFail();

        if ($invite->expires_at < now()) {
            return response()->json(['message' => 'Invite has expired.'], 422);
        }

        if ($invite->accepted_at !== null) {
            return response()->json(['message' => 'Invite already used.'], 409);
        }

        $member = DB::transaction(function () use ($invite, $request) {
            $invite->update(['accepted_at' => now()]);

            return WorkspaceMember::create([
                'workspace_id' => $invite->workspace_id,
                'user_id' => $request->user()->id,
                'role' => $invite->role,
                'status' => 'active',
                'joined_at' => now(),
            ]);
        });

        return response()->json([
            'data' => new WorkspaceMemberResource($member),
        ], 201);
    }
}
