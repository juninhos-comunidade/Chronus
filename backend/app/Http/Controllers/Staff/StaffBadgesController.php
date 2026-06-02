<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\Badge\CreateBadgeDefinitionRequest;
use App\Http\Resources\BadgeDefinitionResource;
use App\Models\BadgeDefinition;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffBadgesController extends Controller
{
    public function index(): JsonResponse
    {
        $badges = BadgeDefinition::orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => BadgeDefinitionResource::collection($badges),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:60|unique:badge_definitions,code',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'icon_url' => 'nullable|string|max:500',
            'category' => 'required|string|max:50',
            'condition' => 'required|array',
            'is_active' => 'nullable|boolean',
        ]);

        $badge = BadgeDefinition::create($validated);

        return response()->json([
            'data' => new BadgeDefinitionResource($badge),
        ], 201);
    }

    public function update(Request $request, string $code): JsonResponse
    {
        $badge = BadgeDefinition::where('code', $code)->firstOrFail();

        $validated = $request->validate([
            'name' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'icon_url' => 'nullable|string|max:500',
            'category' => 'nullable|string|max:50',
            'condition' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);

        $badge->update($validated);

        return response()->json([
            'data' => new BadgeDefinitionResource($badge),
        ]);
    }
}
