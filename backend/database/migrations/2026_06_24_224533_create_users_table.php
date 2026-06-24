<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->enum('role', ['admin', 'user'])->default('user');

            $table->foreignId('padre_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->string('codigo_acceso', 10)->unique();
            $table->string('cargo')->nullable();
            $table->string('telefono')->nullable();
            $table->string('photo')->nullable();
            $table->string('currency', 3)->default('PEN');

            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};