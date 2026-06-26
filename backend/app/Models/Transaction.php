<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'user_id', 'account_id', 'category_id',
        'transfer_account_id', 'type', 'amount', 'note', 'date',
    ];

    protected $casts = [
        'amount' => 'float',
        'date'   => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function transferAccount()
    {
        return $this->belongsTo(Account::class, 'transfer_account_id');
    }
}