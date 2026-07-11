<?php

namespace App\Models\Planes;

use Illuminate\Database\Eloquent\Model;

class PlanModule extends Model
{
    protected $fillable = ['plan_id', 'module_key'];

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }
}