<?php

namespace App\Http\Middleware;

use App\Models\StaffSession;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class CheckStaffToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $bearer = $request->bearerToken();

        if (!$bearer) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $hashed = hash('sha256', $bearer);

        $session = StaffSession::where('token', $hashed)
            ->where('is_active', true)
            ->where('expires_at', '>', now())
            ->with('staff')
            ->first();

        if (!$session || !$session->staff) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $request->merge(['staffUser' => $session->staff, 'staffSession' => $session]);

        return $next($request);
    }
}
