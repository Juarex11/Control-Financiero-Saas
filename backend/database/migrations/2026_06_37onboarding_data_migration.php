<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'ob_actividad'))
                $table->string('ob_actividad', 30)->nullable()->after('onboarding_done');

            if (!Schema::hasColumn('users', 'ob_monto'))
                $table->decimal('ob_monto', 12, 2)->nullable()->after('ob_actividad');

            if (!Schema::hasColumn('users', 'ob_metas'))
                $table->json('ob_metas')->nullable()->after('ob_monto');

            if (!Schema::hasColumn('users', 'ob_deudas'))
                $table->boolean('ob_deudas')->nullable()->after('ob_metas');

            if (!Schema::hasColumn('users', 'ob_num_deudas'))
                $table->string('ob_num_deudas', 5)->nullable()->after('ob_deudas');

            if (!Schema::hasColumn('users', 'ob_finalidad'))
                $table->string('ob_finalidad', 30)->nullable()->after('ob_num_deudas');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $cols = ['ob_actividad','ob_monto','ob_metas','ob_deudas','ob_num_deudas','ob_finalidad'];
            $table->dropColumn(array_filter($cols, fn($c) => Schema::hasColumn('users', $c)));
        });
    }
};