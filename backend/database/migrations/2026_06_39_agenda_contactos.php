<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agenda_contactos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evento_id')->constrained('agenda_eventos')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            
            $table->string('nombre', 255);
            $table->string('email', 255)->nullable();
            $table->string('telefono', 30)->nullable();
            $table->string('empresa', 255)->nullable();
            $table->string('cargo', 255)->nullable();
            $table->text('notas')->nullable();
            
            $table->enum('rol', ['cliente', 'participante', 'organizador', 'invitado'])->default('participante');
            $table->enum('confirmacion', ['pendiente', 'aceptado', 'rechazado'])->default('pendiente');
            
            $table->timestamps();
            
            $table->index('evento_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agenda_contactos');
    }
};