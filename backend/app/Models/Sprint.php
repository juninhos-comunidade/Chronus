<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Sprint extends Model
{
    use HasFactory, HasUuid;

    protected $fillable = [
        'workspace_id',
        'name',
        'status',
        'goal',
        'capacity_hours',
        'started_at',
        'ends_at',
        'completed_at',
        'created_by',
        'retrospective_notes',
    ];

    protected function casts(): array
    {
        return [
            'capacity_hours' => 'integer',
            'started_at' => 'datetime',
            'ends_at' => 'datetime',
            'completed_at' => 'datetime',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function metrics(): HasOne
    {
        return $this->hasOne(SprintMetric::class);
    }
}
