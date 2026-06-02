<?php

namespace App\Models;

use App\Models\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;


class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuid, SoftDeletes, Notifiable;

    protected $fillable = [
        'email',
        'email_hash',
        'name',
        'phone',
        'password_hash',
        'google_id',
        'avatar',
        'timezone',
        'locale',
        'status',
        'google_id',
    ];

    protected $hidden = [
        'password_hash',
        'email_hash',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'email_verified_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class);
    }

    public function workspaces(): BelongsToMany
    {
        return $this->belongsToMany(Workspace::class, 'workspace_members')
            ->withPivot('role', 'status', 'joined_at')
            ->withTimestamps();
    }

    public function ownedWorkspaces(): HasMany
    {
        return $this->hasMany(Workspace::class, 'owner_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'recipient_id');
    }

    public function assignedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assignee_id');
    }

    public function createdTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'created_by');
    }

    public function timeEntries(): HasMany
    {
        return $this->hasMany(TimeEntry::class);
    }

    public function badges(): HasMany
    {
        return $this->hasMany(UserBadge::class);
    }

    public function taskComments(): HasMany
    {
        return $this->hasMany(TaskComment::class, 'author_id');
    }
}
