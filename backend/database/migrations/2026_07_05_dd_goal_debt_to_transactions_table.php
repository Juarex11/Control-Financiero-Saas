<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('transactions', 'goal_id')) {
                $table->foreignId('goal_id')
                      ->nullable()
                      ->after('transfer_account_id')
                      ->constrained('goals')
                      ->nullOnDelete();
            }

            if (!Schema::hasColumn('transactions', 'debt_id')) {
                $table->foreignId('debt_id')
                      ->nullable()
                      ->after('goal_id')
                      ->constrained('debts')
                      ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            if (Schema::hasColumn('transactions', 'goal_id')) {
                $table->dropConstrainedForeignId('goal_id');
            }
            if (Schema::hasColumn('transactions', 'debt_id')) {
                $table->dropConstrainedForeignId('debt_id');
            }
        });
    }
};