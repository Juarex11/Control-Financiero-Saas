// database/migrations/xxxx_create_plan_modules_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_modules', function (Blueprint $table) {
            $table->id();

            $table->foreignId('plan_id')
                  ->constrained('plans')
                  ->cascadeOnDelete();

            $table->string('module_key', 50); // 'mi-equipo' | 'membresia' | 'comisiones' | 'ganancias' | 'plan-emprendedor'

            $table->timestamps();

            $table->unique(['plan_id', 'module_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_modules');
    }
};