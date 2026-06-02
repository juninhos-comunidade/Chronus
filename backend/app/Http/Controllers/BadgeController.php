<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BadgeController extends Controller
{
    public function definitions(): JsonResponse
    {
        return response()->json(['message' => 'Not implemented yet.'], 501);
    }

    public function workspaceBadges(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Not implemented yet.'], 501);
    }

    public function myBadges(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Not implemented yet.'], 501);
    }

    public function memberBadges(Request $request): JsonResponse
    {
        return response()->json(['message' => 'Not implemented yet.'], 501);
    }
}
