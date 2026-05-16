<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_code',
        'employee_ref_id',
        'company',
        'name',
        'designation',
        'meal_eligibility',
        'duty_status',
        'date_of_joining',
        'expiry_date',
        'grade',
        'profile_picture',
        'site_id',
        'is_vip',
        'active',
    ];

    protected $casts = [
        'is_vip' => 'boolean',
        'active' => 'boolean',
        'meal_eligibility' => 'boolean',
        'date_of_joining' => 'date:Y-m-d',
        'expiry_date' => 'date:Y-m-d',
    ];

    public function logs(): HasMany
    {
        return $this->hasMany(MealLog::class);
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }
}
