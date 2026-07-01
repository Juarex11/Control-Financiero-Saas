<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agenda_archivos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evento_id')->constrained('agenda_eventos')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            $table->string('nombre_original', 255);
            $table->string('ruta', 500);
            $table->string('tipo_mime', 100)->nullable();
            $table->bigInteger('tamanio')->unsigned()->nullable();
            
            $table->timestamps();
            
            $table->index('evento_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agenda_archivos');
    }
};