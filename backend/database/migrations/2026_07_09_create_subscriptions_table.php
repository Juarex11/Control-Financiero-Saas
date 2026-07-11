// database/migrations/xxxx_create_subscriptions_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->foreignId('plan_id')
                  ->constrained('plans')
                  ->restrictOnDelete(); // por seguridad, no se puede borrar un plan con suscripciones

            $table->enum('modalidad', ['mensual', 'trimestral', 'semestral', 'anual', 'trial'])->default('trial');
            $table->date('starts_at');
            $table->date('ends_at');
            $table->enum('status', ['trial', 'active', 'expired', 'cancelled'])->default('trial');

            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};