<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class SupplierUser extends Authenticatable
{
    use HasApiTokens, Notifiable, SoftDeletes;

    public const ROLE_REP        = 'rep';
    public const ROLE_SUPERVISOR = 'supervisor';
    public const ROLE_ADMIN      = 'admin';

    public const ROLES = [self::ROLE_REP, self::ROLE_SUPERVISOR, self::ROLE_ADMIN];

    protected $fillable = [
        'supplier_id',
        'name',
        'email',
        'password',
        'role',
        'active',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password'      => 'hashed',
            'active'        => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function hasPermission(string $key): bool
    {
        return false;
    }

    public function permissionKeys(): array
    {
        return [];
    }
}
