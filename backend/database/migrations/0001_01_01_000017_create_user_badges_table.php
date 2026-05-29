<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_badges', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->uuid('workspace_id');
            $table->string('badge_code', 100);
            $table->timestamp('unlocked_at')->useCurrent();
            $table->json('context')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->foreign('badge_code')->references('code')->on('badge_definitions')->restrictOnDelete();

            $table->unique(['user_id', 'workspace_id', 'badge_code'], 'user_badges_user_workspace_badge_idx');
            $table->index(['user_id', 'workspace_id'], 'user_badges_user_idx');
            $table->index('workspace_id', 'user_badges_workspace_idx');
            $table->index('unlocked_at', 'user_badges_unlocked_at_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_badges');
    }
};
