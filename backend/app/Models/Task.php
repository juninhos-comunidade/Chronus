<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use HasFactory, HasUuid, SoftDeletes;

    protected $fillable = [
        'workspace_id',
        'sprint_id',
        'title',
        'description',
        'status',
        'priority',
        'assignee_id',
        'created_by',
        'estimated_minutes',
        'actual_minutes',
        'due_date',
        'tags',
        'position',
        'is_blocked',
        'blocked_reason',
        'blocked_since',
    ];

    protected function casts(): array
    {
        return [
            'estimated_minutes' => 'integer',
            'actual_minutes' => 'integer',
            'due_date' => 'datetime',
            'tags' => 'array',
            'position' => 'float',
            'is_blocked' => 'boolean',
            'blocked_since' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function sprint(): BelongsTo
    {
        return $this->belongsTo(Sprint::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TaskComment::class);
    }

    public function history(): HasMany
    {
        return $this->hasMany(TaskHistory::class);
    }

    public function timeEntries(): HasMany
    {
        return $this->hasMany(TimeEntry::class);
    }

    protected static function booted(): void
    {
        static::updating(function (Task $task) {
            if ($task->isDirty('status')) {
                $oldStatus = $task->getOriginal('status');
                $newStatus = $task->status;

                $task->history()->create([
                    'changed_by' => auth()->id() ?? $task->created_by,
                    'field' => 'status',
                    'old_value' => $oldStatus,
                    'new_value' => $newStatus,
                ]);
            }
        });
    }
}
