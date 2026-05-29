<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserBadge extends Model
{
    use HasFactory, HasUuid;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'workspace_id',
        'badge_code',
        'unlocked_at',
        'context',
    ];

    protected function casts(): array
    {
        return [
            'unlocked_at' => 'datetime',
            'context' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function badge(): BelongsTo
    {
        return $this->belongsTo(BadgeDefinition::class, 'badge_code', 'code');
    }
}
