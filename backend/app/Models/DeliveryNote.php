<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryNote extends Model
{
    use HasFactory;

    protected $fillable = [
        'note_no',
        'delivery_date',
        'delivery_time',
        'site_id',
        'supplier_id',
        'meal_rule_id',
        'meal_category_id',
        'quantity_requested',
        'quantity_delivered',
        'status',
        'attachment_path',
        'received_by',
        'notes',
    ];

    protected $casts = [
        'delivery_date'      => 'date',
        'quantity_requested' => 'integer',
        'quantity_delivered' => 'integer',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function mealRule(): BelongsTo
    {
        return $this->belongsTo(MealRule::class);
    }

    public function mealCategory(): BelongsTo
    {
        return $this->belongsTo(MealCategory::class);
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public static function nextNoteNo(): string
    {
        $last = static::orderByDesc('id')->first();
        $next = $last ? ((int) preg_replace('/\D/', '', $last->note_no)) + 1 : 1;
        return 'DN' . str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
