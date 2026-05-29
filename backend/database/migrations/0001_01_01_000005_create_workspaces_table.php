<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspaces', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('name', 100);
            $table->string('slug', 100);
            $table->uuid('owner_id');
            $table->integer('sprint_duration_days')->default(14);
            $table->string('timezone', 100)->default('UTC');
            $table->json('kanban_config')->nullable();
            $table->string('status', 20)->default('active');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->softDeletes();

            $table->foreign('owner_id')->references('id')->on('users')->restrictOnDelete();

            $table->unique('slug', 'workspaces_slug_idx');
            $table->index('owner_id', 'workspaces_owner_idx');
            $table->index('status', 'workspaces_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workspaces');
    }
};
