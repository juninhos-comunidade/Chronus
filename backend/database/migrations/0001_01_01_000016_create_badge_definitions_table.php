<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('badge_definitions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->string('code', 100)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->text('icon_url')->nullable();
            $table->string('category', 30);
            $table->json('condition');
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->index('category', 'badge_definitions_category_idx');
            $table->index('is_active', 'badge_definitions_active_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('badge_definitions');
    }
};
