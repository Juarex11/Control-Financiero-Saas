<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_payment_logs', function (Blueprint $table) {
            $table->id();

            $table->foreignId('recurring_payment_id')
                  ->constrained('recurring_payments')
                  ->cascadeOnDelete();

            $table->date('scheduled_date');
            $table->enum('status', ['pending', 'paid', 'skipped'])->default('pending');
            $table->timestamp('actioned_at')->nullable();
            $table->text('note')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_payment_logs');
    }
};