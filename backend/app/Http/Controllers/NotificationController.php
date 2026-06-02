<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Not implemented yet.'], 501);
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        return response()->json(['message' => 'Not implemented yet.'], 501);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Not implemented yet.'], 501);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        return response()->json(['message' => 'Not implemented yet.'], 501);
    }
}
