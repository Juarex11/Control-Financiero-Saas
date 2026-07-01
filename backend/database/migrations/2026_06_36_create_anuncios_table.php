<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // database/migrations/xxxx_create_anuncios_table.php
public function up(): void
{
    Schema::create('anuncios', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->string('titulo', 255);
        $table->text('contenido')->nullable();
        $table->string('imagen')->nullable();
        $table->boolean('anclado')->default(false);
        $table->string('duracion_anclado', 20)->nullable(); // 1d, 1w, 1m, siempre
        $table->timestamp('anclado_hasta')->nullable();
        $table->timestamp('expira_at');
        $table->timestamps();
    });

    Schema::create('reacciones', function (Blueprint $table) {
        $table->id();
        $table->foreignId('anuncio_id')->constrained()->cascadeOnDelete();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->string('tipo', 20); // like, corazon, risa, tristeza, asombro, celebracion
        $table->timestamps();
        $table->unique(['anuncio_id', 'user_id']); // una reacción por usuario por anuncio
    });
}

public function down(): void
{
    Schema::dropIfExists('reacciones');
    Schema::dropIfExists('anuncios');
}
};