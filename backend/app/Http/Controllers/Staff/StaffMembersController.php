<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\CreateStaffRequest;
use App\Http\Resources\StaffUserResource;
use App\Models\StaffUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StaffMembersController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = StaffUser::query();

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $members = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => StaffUserResource::collection($members),
        ]);
    }

    public function store(CreateStaffRequest $request): JsonResponse
    {
        $emailHash = hash('sha256', strtolower($request->email));

        $exists = StaffUser::where('email_hash', $emailHash)->exists();

        if ($exists) {
            return response()->json(['message' => 'Email already in use.'], 409);
        }

        $staff = StaffUser::create([
            'email' => $request->email,
            'email_hash' => $emailHash,
            'name' => $request->name,
            'password_hash' => Hash::make($request->password),
            'is_active' => true,
        ]);

        return response()->json([
            'data' => new StaffUserResource($staff),
        ], 201);
    }

    public function deactivate(Request $request, string $id): JsonResponse
    {
        $staffUser = $request->staffUser;

        if ($staffUser->id === $id) {
            return response()->json(['message' => 'Cannot deactivate yourself.'], 403);
        }

        $staff = StaffUser::findOrFail($id);
        $staff->update(['is_active' => false]);

        return response()->json(null, 204);
    }
}
