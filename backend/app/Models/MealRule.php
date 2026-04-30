<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MealRule extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'start_time', 'end_time', 'max_per_day', 'active'];

    protected $casts = [
        'active' => 'boolean',
        'max_per_day' => 'integer',
    ];
}
