<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_history', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('task_id');
            $table->uuid('changed_by');
            $table->string('field', 50);
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->timestamp('changed_at')->useCurrent();

            $table->foreign('task_id')->references('id')->on('tasks')->cascadeOnDelete();
            $table->foreign('changed_by')->references('id')->on('users')->restrictOnDelete();

            $table->index('task_id', 'task_history_task_idx');
            $table->index('changed_by', 'task_history_changed_by_idx');
            $table->index(['task_id', 'changed_at'], 'task_history_changed_at_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_history');
    }
};
