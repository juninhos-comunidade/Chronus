<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_comments', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
            $table->uuid('task_id');
            $table->uuid('author_id');
            $table->text('content');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('edited_at')->nullable();
            $table->softDeletes();

            $table->foreign('task_id')->references('id')->on('tasks')->cascadeOnDelete();
            $table->foreign('author_id')->references('id')->on('users')->cascadeOnDelete();

            $table->index('task_id', 'task_comments_task_idx');
            $table->index('author_id', 'task_comments_author_idx');
            $table->index(['task_id', 'created_at'], 'task_comments_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_comments');
    }
};
