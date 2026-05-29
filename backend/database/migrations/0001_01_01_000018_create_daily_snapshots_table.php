<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_snapshots', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('workspace_id');
            $table->timestamp('date');
            $table->integer('tasks_created')->default(0);
            $table->integer('tasks_completed')->default(0);
            $table->integer('tasks_blocked')->default(0);
            $table->integer('total_time_seconds')->default(0);
            $table->integer('active_members')->default(0);
            $table->integer('pomodoros_completed')->default(0);
            $table->integer('idle_tasks_detected')->default(0);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();

            $table->unique(['workspace_id', 'date'], 'daily_snapshots_workspace_date_idx');
            $table->index('workspace_id', 'daily_snapshots_workspace_idx');
            $table->index('date', 'daily_snapshots_date_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_snapshots');
    }
};
