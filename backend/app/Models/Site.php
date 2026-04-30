<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Site extends Model
{
    use HasFactory;

    protected $fillable = [
        'site_code',
        'name',
        'type',
        'status',
        'description',
        'start_date',
        'end_date',
        'pin',
        'active',
    ];

    protected $hidden = ['pin'];

    protected $casts = [
        'active' => 'boolean',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function suppliers(): BelongsToMany
    {
        return $this->belongsToMany(Supplier::class, 'site_supplier')->withTimestamps();
    }

    public function supplierMealAssignments(): HasMany
    {
        return $this->hasMany(SupplierMealAssignment::class);
    }

    public function distributionAssignments(): HasMany
    {
        return $this->hasMany(DistributionAssignment::class);
    }

    public function foodRequests(): HasMany
    {
        return $this->hasMany(FoodRequest::class);
    }
}
