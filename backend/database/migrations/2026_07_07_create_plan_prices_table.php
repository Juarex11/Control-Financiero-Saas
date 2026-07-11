// database/migrations/xxxx_create_plan_prices_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_prices', function (Blueprint $table) {
            $table->id();

            $table->foreignId('plan_id')
                  ->constrained('plans')
                  ->cascadeOnDelete();

            $table->enum('modalidad', ['mensual', 'trimestral', 'semestral', 'anual']);
            $table->decimal('price', 10, 2);

            $table->timestamps();

            // Un plan no puede tener 2 precios para la misma modalidad
            $table->unique(['plan_id', 'modalidad']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_prices');
    }
};