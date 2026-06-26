<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reaccion extends Model
{
    protected $table = 'reacciones';

    protected $fillable = [
        'anuncio_id',
        'user_id',
        'tipo',
    ];

    // 👈 Evitar creación masiva con tipos inválidos
    protected $casts = [
        'tipo' => 'string',
    ];

    public function anuncio(): BelongsTo
    {
        return $this->belongsTo(Anuncio::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}