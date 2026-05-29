<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('workspace_id');
            $table->uuid('sprint_id')->nullable();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->string('status', 30)->default('backlog');
            $table->string('priority', 20)->default('medium');
            $table->uuid('assignee_id')->nullable();
            $table->uuid('created_by');
            $table->integer('estimated_minutes')->nullable();
            $table->integer('actual_minutes')->default(0);
            $table->timestamp('due_date')->nullable();
            $table->json('tags')->nullable();
            $table->float('position')->default(0);
            $table->boolean('is_blocked')->default(false);
            $table->text('blocked_reason')->nullable();
            $table->timestamp('blocked_since')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->softDeletes();

            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->foreign('sprint_id')->references('id')->on('sprints')->nullOnDelete();
            $table->foreign('assignee_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->restrictOnDelete();

            $table->index('workspace_id', 'tasks_workspace_idx');
            $table->index('sprint_id', 'tasks_sprint_idx');
            $table->index(['workspace_id', 'status'], 'tasks_status_idx');
            $table->index('assignee_id', 'tasks_assignee_idx');
            $table->index(['workspace_id', 'priority'], 'tasks_priority_idx');
            $table->index(['workspace_id', 'is_blocked'], 'tasks_blocked_idx');
            $table->index(['sprint_id', 'status', 'position'], 'tasks_position_idx');
            $table->index(['workspace_id', 'sprint_id'], 'tasks_backlog_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
