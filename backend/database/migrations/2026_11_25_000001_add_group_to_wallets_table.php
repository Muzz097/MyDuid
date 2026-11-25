<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wallets', function (Blueprint $table) {
            $table->string('group', 20)->default('daily')->after('is_active');
        });

        DB::statement("ALTER TABLE wallets ADD CONSTRAINT wallets_group_chk CHECK (\"group\" IN ('daily','savings','investment'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_group_chk');

        Schema::table('wallets', function (Blueprint $table) {
            $table->dropColumn('group');
        });
    }
};
