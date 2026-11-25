<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('wallets', function (Blueprint $table) {
            $table->string('card_theme', 20)->default('default')->after('group');
        });

        DB::statement("ALTER TABLE wallets ADD CONSTRAINT wallets_card_theme_chk CHECK (card_theme IN ('default','rose','ocean','emerald','sunset','graphite'))");

        DB::statement('ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_icon_chk');
        DB::statement("ALTER TABLE wallets ADD CONSTRAINT wallets_icon_chk CHECK (
    (icon_type = 'preset' AND icon_key IS NOT NULL AND icon_path IS NULL) OR
    (icon_type = 'emoji' AND icon_key IS NOT NULL AND icon_path IS NULL) OR
    (icon_type = 'custom' AND icon_path IS NOT NULL)
)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_icon_chk');
        DB::statement("ALTER TABLE wallets ADD CONSTRAINT wallets_icon_chk CHECK (
    (icon_type = 'preset' AND icon_key IS NOT NULL AND icon_path IS NULL) OR
    (icon_type = 'custom' AND icon_path IS NOT NULL)
)");

        DB::statement('ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_card_theme_chk');

        Schema::table('wallets', function (Blueprint $table) {
            $table->dropColumn('card_theme');
        });
    }
};
