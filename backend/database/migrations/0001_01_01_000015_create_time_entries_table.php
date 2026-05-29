<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('time_entries', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('task_id');
            $table->uuid('user_id');
            $table->uuid('workspace_id');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('ended_at')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->string('type', 20)->default('timer');
            $table->integer('pomodoro_count')->default(0);
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('task_id')->references('id')->on('tasks')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();

            $table->index('task_id', 'time_entries_task_idx');
            $table->index('user_id', 'time_entries_user_idx');
            $table->index('workspace_id', 'time_entries_workspace_idx');
            $table->index(['user_id', 'ended_at'], 'time_entries_active_idx');
            $table->index(['workspace_id', 'started_at'], 'time_entries_started_at_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('time_entries');
    }
};
