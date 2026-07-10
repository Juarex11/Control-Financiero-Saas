<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('recurring_payment_log_id')
                  ->nullable()
                  ->after('transfer_account_id')
                  ->constrained('recurring_payment_logs')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['recurring_payment_log_id']);
            $table->dropColumn('recurring_payment_log_id');
        });
    }
};