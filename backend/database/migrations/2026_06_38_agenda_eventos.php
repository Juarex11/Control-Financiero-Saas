<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agenda_eventos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            $table->enum('tipo', ['cita', 'reunion', 'evento', 'recordatorio', 'tarea'])->default('evento');
            $table->string('titulo', 255);
            $table->text('descripcion')->nullable();
            $table->string('lugar', 255)->nullable();
            $table->string('link_reunion', 500)->nullable();
            
            $table->datetime('fecha_inicio');
            $table->datetime('fecha_fin')->nullable();
            $table->boolean('todo_el_dia')->default(false);
            $table->string('zona_horaria', 50)->nullable();
            
            $table->integer('recordatorio_minutos')->nullable()->comment('0,15,30,60,120,1440');
            $table->enum('estado', ['pendiente', 'confirmada', 'en_proceso', 'finalizada', 'cancelada'])->default('pendiente');
            $table->text('motivo_cancelacion')->nullable();
            
            $table->string('color', 7)->nullable();
            $table->enum('prioridad', ['baja', 'media', 'alta'])->default('media');
            
            $table->enum('repeticion', ['ninguna', 'diaria', 'semanal', 'mensual', 'anual'])->default('ninguna');
            $table->date('repeticion_hasta')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Índices
            $table->index(['user_id', 'fecha_inicio']);
            $table->index('estado');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agenda_eventos');
    }
};