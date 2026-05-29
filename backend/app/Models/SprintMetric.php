<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SprintMetric extends Model
{
    use HasFactory, HasUuid;

    public $timestamps = false;

    protected $fillable = [
        'sprint_id',
        'total_tasks_planned',
        'total_tasks_completed',
        'total_tasks_carried_over',
        'total_time_logged_seconds',
        'completion_rate',
        'members_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'total_tasks_planned' => 'integer',
            'total_tasks_completed' => 'integer',
            'total_tasks_carried_over' => 'integer',
            'total_time_logged_seconds' => 'integer',
            'completion_rate' => 'integer',
            'members_snapshot' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function sprint(): BelongsTo
    {
        return $this->belongsTo(Sprint::class);
    }
}
