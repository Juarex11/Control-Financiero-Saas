<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = [
        'user_id', 'name', 'icon', 'color', 'type', 'is_default', 'order',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'order'      => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}