<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Complaint extends Model
{
    use HasFactory;

    protected $fillable = [
        'ref_no',
        'date_logged',
        'site_id',
        'supplier_id',
        'meal_rule_id',
        'issue_type',
        'description',
        'attachment_path',
        'logged_by',
        'status',
        'date_resolved',
        'remarks',
        'supplier_response',
        'supplier_responded_at',
    ];

    protected $casts = [
        'date_logged'           => 'date',
        'date_resolved'         => 'date',
        'supplier_responded_at' => 'datetime',
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

    public function logger(): BelongsTo
    {
        return $this->belongsTo(User::class, 'logged_by');
    }

    public static function nextRefNo(): string
    {
        $last = static::orderByDesc('id')->first();
        $next = $last ? ((int) preg_replace('/\D/', '', $last->ref_no)) + 1 : 1;
        return 'C' . str_pad((string) $next, 3, '0', STR_PAD_LEFT);
    }
}
