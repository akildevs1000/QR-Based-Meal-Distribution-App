<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteMealQuota extends Model
{
    use HasFactory;

    protected $fillable = ['site_id', 'meal_rule_id', 'quantity'];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function mealRule(): BelongsTo
    {
        return $this->belongsTo(MealRule::class);
    }
}
