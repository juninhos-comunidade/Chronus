<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Sprint;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;

class StaffMetricsController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => [
                'workspaces_active' => Workspace::where('status', 'active')->count(),
                'users_total' => User::count(),
                'tasks_created' => Task::count(),
                'tasks_completed' => Task::where('status', 'done')->count(),
                'sprints_completed' => Sprint::where('status', 'completed')->count(),
            ],
        ]);
    }
}
