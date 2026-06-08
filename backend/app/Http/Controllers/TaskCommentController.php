<?php

namespace App\Http\Controllers;

use App\Http\Requests\Task\TaskCommentRequest;
use App\Http\Resources\TaskCommentResource;
use App\Models\Task;
use App\Models\TaskComment;
use Illuminate\Support\Str;

class TaskCommentController extends Controller
{
    public function index(string $workspaceId, string $id)
    {
        $task = $this->findTaskOrFail($workspaceId, $id);

        $comments = TaskComment::query()
            ->with('author')
            ->where('task_id', $task->id)
            ->orderBy('created_at')
            ->get();

        return TaskCommentResource::collection($comments);
    }

    public function store(
        TaskCommentRequest $request,
        string $workspaceId,
        string $id
    ) {
        $task = $this->findTaskOrFail($workspaceId, $id);

        $comment = TaskComment::create([
            'task_id' => $task->id,
            'author_id' => auth()->id(),
            'content' => $request->validated('content'),
        ]);

        return (new TaskCommentResource($comment->load('author')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(
        TaskCommentRequest $request,
        string $workspaceId,
        string $id,
        string $commentId
    ) {
        $this->findTaskOrFail($workspaceId, $id);
        $comment = $this->findCommentOrFail($id, $commentId);

        abort_unless($comment->author_id === auth()->id(), 403);

        $comment->update([
            'content' => $request->validated('content'),
            'edited_at' => now(),
        ]);

        return new TaskCommentResource($comment->refresh()->load('author'));
    }

    public function destroy(string $workspaceId, string $id, string $commentId)
    {
        $this->findTaskOrFail($workspaceId, $id);
        $comment = $this->findCommentOrFail($id, $commentId);

        abort_unless($comment->author_id === auth()->id(), 403);

        $comment->delete();

        return response()->noContent();
    }

    private function findTaskOrFail(string $workspaceId, string $id): Task
    {
        abort_unless(Str::isUuid($workspaceId) && Str::isUuid($id), 404);

        return Task::query()
            ->where('workspace_id', $workspaceId)
            ->findOrFail($id);
    }

    private function findCommentOrFail(string $taskId, string $commentId): TaskComment
    {
        abort_unless(Str::isUuid($taskId) && Str::isUuid($commentId), 404);

        return TaskComment::query()
            ->where('task_id', $taskId)
            ->findOrFail($commentId);
    }
}
