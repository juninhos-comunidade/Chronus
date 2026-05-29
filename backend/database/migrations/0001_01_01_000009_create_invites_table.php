<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invites', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('workspace_id');
            $table->text('email');
            $table->string('role', 20)->default('member');
            $table->text('token');
            $table->uuid('invited_by');
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();
            $table->foreign('invited_by')->references('id')->on('users')->cascadeOnDelete();

            $table->unique('token', 'invites_token_idx');
            $table->index('workspace_id', 'invites_workspace_idx');
            $table->index('email', 'invites_email_idx');
            $table->index('expires_at', 'invites_expires_at_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invites');
    }
};
