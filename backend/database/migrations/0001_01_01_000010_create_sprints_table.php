<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sprints', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('workspace_id');
            $table->string('name', 150);
            $table->string('status', 20)->default('draft');
            $table->text('goal')->nullable();
            $table->integer('capacity_hours')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->uuid('created_by');
            $table->text('retrospective_notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->restrictOnDelete();

            $table->index('workspace_id', 'sprints_workspace_idx');
            $table->index(['workspace_id', 'status'], 'sprints_status_idx');
            $table->index(['workspace_id', 'status', 'started_at'], 'sprints_active_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sprints');
    }
};
