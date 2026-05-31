<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->text('email')->notNullable();
            $table->text('email_hash')->notNullable();
            $table->string('email_verified_at')->nullable();
            $table->text('name')->notNullable();
            $table->text('phone')->nullable();
            $table->text('password_hash')->nullable();
            $table->text('google_id')->nullable();
            $table->text('avatar')->nullable();
            $table->string('timezone', 100)->nullable();
            $table->string('locale', 10)->default('pt');
            $table->string('status', 20)->default('active');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->softDeletes();

            $table->unique('email_hash', 'users_email_hash_idx');
            $table->unique('google_id', 'users_google_id_idx');
            $table->index('status', 'users_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
