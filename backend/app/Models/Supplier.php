<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'supplier_code',
        'name',
        'status',
        'start_date',
        'end_date',
        'contact_person',
        'contact_email',
        'contact_phone',
        'address',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function documents(): HasMany
    {
        return $this->hasMany(SupplierDocument::class);
    }

    public function sites(): BelongsToMany
    {
        return $this->belongsToMany(Site::class, 'site_supplier')->withTimestamps();
    }

    public function mealAssignments(): HasMany
    {
        return $this->hasMany(SupplierMealAssignment::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(SupplierUser::class);
    }
}
