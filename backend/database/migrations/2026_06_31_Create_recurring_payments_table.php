<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->foreignId('account_id')
                  ->constrained('accounts')
                  ->cascadeOnDelete();

            $table->foreignId('reminder_category_id')
                  ->nullable()
                  ->constrained('reminder_categories')
                  ->nullOnDelete();

            $table->enum('type', ['income', 'expense']);
            $table->string('name', 120);
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('PEN');

            $table->enum('frequency', [
                'once',
                'daily',
                'weekly',
                'biweekly',
                'every4weeks',
                'monthly',
                'bimonthly',
                'quarterly',
                'semiannual',
            ]);

            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->date('next_reminder_date')->nullable();
            $table->time('reminder_time')->default('08:00:00');

            $table->string('label', 80)->nullable();
            $table->text('comment')->nullable();

            $table->enum('status', ['active', 'paused'])->default('active');

            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['next_reminder_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_payments');
    }
};