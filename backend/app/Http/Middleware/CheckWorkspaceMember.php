<?php

namespace App\Http\Middleware;

use App\Models\WorkspaceMember;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckWorkspaceMember
{
    public function handle(Request $request, Closure $next): Response
    {
        $workspaceId = $request->route('workspaceId');

        if (!$workspaceId) {
            return response()->json(['message' => 'Workspace not found.'], 404);
        }

        $member = WorkspaceMember::where('workspace_id', $workspaceId)
            ->where('user_id', auth()->id())
            ->where('status', 'active')
            ->first();

        if (!$member) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $request->merge(['workspaceMember' => $member]);

        return $next($request);
    }
}
