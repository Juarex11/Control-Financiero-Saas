<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        if (!Schema::hasColumn('users', 'timezone'))
            $table->string('timezone', 60)->nullable()->after('currency');

        if (!Schema::hasColumn('users', 'pais'))
            $table->string('pais', 60)->nullable()->after('timezone');

        if (!Schema::hasColumn('users', 'onboarding_done'))
            $table->boolean('onboarding_done')->default(false)->after('pais');
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn(
            collect(['timezone', 'pais', 'onboarding_done'])
                ->filter(fn($col) => Schema::hasColumn('users', $col))
                ->values()
                ->toArray()
        );
    });
}
};