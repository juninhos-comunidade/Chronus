<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BadgeDefinition extends Model
{
    use HasFactory, HasUuid;

    protected $fillable = [
        'code',
        'name',
        'description',
        'icon_url',
        'category',
        'condition',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'condition' => 'array',
            'is_active' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function userBadges(): HasMany
    {
        return $this->hasMany(UserBadge::class, 'badge_code', 'code');
    }
}
