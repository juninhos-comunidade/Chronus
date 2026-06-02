<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\StaffLoginRequest;
use App\Http\Resources\StaffUserResource;
use App\Models\StaffUser;
use App\Models\StaffSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StaffAuthController extends Controller
{
    public function login(StaffLoginRequest $request): JsonResponse
    {
        $emailHash = hash('sha256', strtolower($request->email));

        $staff = StaffUser::where('email_hash', $emailHash)->first();

        if (!$staff || !Hash::check($request->password, $staff->password_hash)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if (!$staff->is_active) {
            return response()->json(['message' => 'Account is deactivated.'], 403);
        }

        $token = Str::random(80);
        $refreshToken = Str::random(80);

        StaffSession::create([
            'staff_id' => $staff->id,
            'token' => hash('sha256', $token),
            'refresh_token' => hash('sha256', $refreshToken),
            'user_agent' => $request->userAgent(),
            'ip_address' => $request->ip(),
            'is_active' => true,
            'expires_at' => now()->addDays(30),
        ]);

        $staff->update(['last_login_at' => now()]);

        return response()->json([
            'data' => [
                'token' => $token,
                'refresh_token' => $refreshToken,
                'staff' => new StaffUserResource($staff),
            ],
        ]);
    }

    public function refresh(Request $request): JsonResponse
    {
        $request->validate(['refresh_token' => 'required|string']);

        $hashed = hash('sha256', $request->refresh_token);

        $session = StaffSession::where('refresh_token', $hashed)
            ->where('is_active', true)
            ->where('expires_at', '>', now())
            ->first();

        if (!$session) {
            return response()->json(['message' => 'Invalid or expired refresh token.'], 401);
        }

        $session->update(['is_active' => false, 'revoked_at' => now()]);

        $token = Str::random(80);
        $refreshToken = Str::random(80);

        StaffSession::create([
            'staff_id' => $session->staff_id,
            'token' => hash('sha256', $token),
            'refresh_token' => hash('sha256', $refreshToken),
            'user_agent' => $request->userAgent(),
            'ip_address' => $request->ip(),
            'is_active' => true,
            'expires_at' => now()->addDays(30),
        ]);

        return response()->json([
            'data' => [
                'token' => $token,
                'refresh_token' => $refreshToken,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $session = $request->staffSession;

        if ($session) {
            $session->update(['is_active' => false, 'revoked_at' => now()]);
        }

        return response()->json(null, 204);
    }
}
