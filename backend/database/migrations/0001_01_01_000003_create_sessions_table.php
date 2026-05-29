<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sessions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('user_id');
            $table->text('token')->unique();
            $table->text('refresh_token')->unique()->nullable();
            $table->text('user_agent')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('device_type', 30)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('expires_at');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->timestamp('revoked_at')->nullable();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();

            $table->index('user_id', 'sessions_user_idx');
            $table->index('token', 'sessions_token_idx');
            $table->index('refresh_token', 'sessions_refresh_token_idx');
            $table->index('expires_at', 'sessions_expires_at_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
    }
};
