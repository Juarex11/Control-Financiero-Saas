<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->string('name', 100);                        // "Efectivo", "BCP", etc.
            $table->string('icon', 50)->default('wallet');      // clave del ícono
            $table->string('color', 7)->default('#31138b');     // hex color
            $table->string('currency', 3)->default('PEN');      // PEN, USD, EUR...
            $table->decimal('balance', 15, 2)->default(0.00);   // saldo actual
            $table->string('note')->nullable();                  // nota opcional
            $table->boolean('is_primary')->default(false);      // cuenta principal
            $table->unsignedInteger('order')->default(0);       // orden en la lista

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};