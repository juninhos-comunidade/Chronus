<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    use HasFactory, HasUuid;

    protected $table = 'activity_log';

    public $timestamps = false;

    protected $fillable = [
        'workspace_id',
        'actor_id',
        'actor_staff_id',
        'action',
        'entity_type',
        'entity_id',
        'old_value',
        'new_value',
        'metadata',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'old_value' => 'array',
            'new_value' => 'array',
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function actorStaff(): BelongsTo
    {
        return $this->belongsTo(StaffUser::class, 'actor_staff_id');
    }
}
