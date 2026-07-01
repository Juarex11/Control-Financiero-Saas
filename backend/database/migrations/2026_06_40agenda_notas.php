<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agenda_notas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evento_id')->constrained('agenda_eventos')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            $table->text('contenido');
            $table->boolean('privada')->default(false);
            
            $table->timestamps();
            
            $table->index('evento_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agenda_notas');
    }
};