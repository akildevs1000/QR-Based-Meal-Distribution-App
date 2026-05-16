<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MealRemark extends Model
{
    public const AUTHOR_ADMIN         = 'admin';
    public const AUTHOR_SUPPLIER_USER = 'supplier_user';

    protected $fillable = [
        'supplier_id',
        'site_id',
        'meal_rule_id',
        'remark_date',
        'meals_requested',
        'remark',
        'added_by_type',
        'added_by_id',
        'added_by_name',
    ];

    protected $casts = [
        'remark_date'     => 'date',
        'meals_requested' => 'integer',
        'added_by_id'     => 'integer',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function mealRule(): BelongsTo
    {
        return $this->belongsTo(MealRule::class);
    }
}
