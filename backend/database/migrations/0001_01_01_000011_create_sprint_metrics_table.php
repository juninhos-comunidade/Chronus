<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sprint_metrics', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('sprint_id')->unique();
            $table->integer('total_tasks_planned')->default(0);
            $table->integer('total_tasks_completed')->default(0);
            $table->integer('total_tasks_carried_over')->default(0);
            $table->integer('total_time_logged_seconds')->default(0);
            $table->integer('completion_rate')->default(0);
            $table->json('members_snapshot')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('sprint_id')->references('id')->on('sprints')->cascadeOnDelete();

            $table->unique('sprint_id', 'sprint_metrics_sprint_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sprint_metrics');
    }
};
