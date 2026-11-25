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
        Schema::create('wallet_goals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('wallet_id');
            $table->string('name', 100);
            $table->bigInteger('target_amount');
            $table->date('deadline')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique('wallet_id'); // satu goal per dompet

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign(['wallet_id', 'user_id'])->references(['id', 'user_id'])->on('wallets')->cascadeOnDelete();

            $table->index('user_id');
        });

        DB::statement('ALTER TABLE wallet_goals ADD CONSTRAINT wallet_goals_target_chk CHECK (target_amount > 0)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_goals');
    }
};
