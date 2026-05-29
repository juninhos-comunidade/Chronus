<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('recipient_id');
            $table->uuid('workspace_id')->nullable();
            $table->string('type', 100);
            $table->string('priority', 20)->default('normal');
            $table->string('title', 255);
            $table->text('message')->nullable();
            $table->text('action_url')->nullable();
            $table->json('data')->nullable();
            $table->string('related_type', 50)->nullable();
            $table->uuid('related_id')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->softDeletes();

            $table->foreign('recipient_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('workspace_id')->references('id')->on('workspaces')->cascadeOnDelete();

            $table->index('recipient_id', 'notifications_recipient_idx');
            $table->index(['recipient_id', 'is_read'], 'notifications_unread_idx');
            $table->index('workspace_id', 'notifications_workspace_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
