<?php

namespace App\Models\Planes;

use Illuminate\Database\Eloquent\Model;

class PlanPrice extends Model
{
    protected $fillable = ['plan_id', 'modalidad', 'price'];

    protected $casts = ['price' => 'float'];

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }
}