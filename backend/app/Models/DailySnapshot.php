<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailySnapshot extends Model
{
    use HasFactory, HasUuid;

    public $timestamps = false;

    protected $fillable = [
        'workspace_id',
        'date',
        'tasks_created',
        'tasks_completed',
        'tasks_blocked',
        'total_time_seconds',
        'active_members',
        'pomodoros_completed',
        'idle_tasks_detected',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'datetime',
            'tasks_created' => 'integer',
            'tasks_completed' => 'integer',
            'tasks_blocked' => 'integer',
            'total_time_seconds' => 'integer',
            'active_members' => 'integer',
            'pomodoros_completed' => 'integer',
            'idle_tasks_detected' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
