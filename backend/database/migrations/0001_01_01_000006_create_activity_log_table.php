<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_log', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('workspace_id')->nullable();
            $table->uuid('actor_id')->nullable();
            $table->uuid('actor_staff_id')->nullable();
            $table->string('action', 100);
            $table->string('entity_type', 50);
            $table->uuid('entity_id');
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('workspace_id')->references('id')->on('workspaces')->nullOnDelete();
            $table->foreign('actor_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('actor_staff_id')->references('id')->on('staff_users')->nullOnDelete();

            $table->index('workspace_id', 'activity_log_workspace_idx');
            $table->index(['entity_type', 'entity_id'], 'activity_log_entity_idx');
            $table->index('actor_id', 'activity_log_actor_idx');
            $table->index('actor_staff_id', 'activity_log_staff_idx');
            $table->index('created_at', 'activity_log_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_log');
    }
};
