<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MealCategory extends Model
{
    use HasFactory;

    protected $fillable = ['cuisine_id', 'name', 'active'];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function cuisine(): BelongsTo
    {
        return $this->belongsTo(Cuisine::class);
    }
}
