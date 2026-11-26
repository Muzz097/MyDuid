<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wallet_goals', function (Blueprint $table) {
            $table->bigInteger('starting_amount')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('wallet_goals', function (Blueprint $table) {
            $table->dropColumn('starting_amount');
        });
    }
};
