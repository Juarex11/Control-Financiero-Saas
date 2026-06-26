<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('testimonios', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->text('contenido');
            $table->string('cargo_empresa')->nullable(); // se copia del user al guardar
            $table->unsignedTinyInteger('estrellas')->default(5); // 1-5

            $table->enum('estado', ['pendiente', 'aprobado', 'rechazado'])
                  ->default('pendiente');

            $table->boolean('destacado')->default(false);

            $table->timestamps();

            $table->index(['estado', 'destacado']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('testimonios');
    }
};