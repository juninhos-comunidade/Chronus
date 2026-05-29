<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspace_members', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('workspace_id');
            $table->uuid('user_id');
            $table->string('role', 20)->default('member');
            $table->uuid('invited_by')->nullable();
            $table->timestamp('joined_at')->useCurrent();
            $table->string('status', 20)->default('active');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('invited_by')->references('id')->on('users')->nullOnDelete();

            $table->unique(['workspace_id', 'user_id'], 'workspace_members_workspace_user_idx');
            $table->index('workspace_id', 'workspace_members_workspace_idx');
            $table->index('user_id', 'workspace_members_user_idx');
            $table->index(['workspace_id', 'role'], 'workspace_members_role_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workspace_members');
    }
};
