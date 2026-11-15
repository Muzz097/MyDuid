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
        Schema::create('transfers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('source_wallet_id');
            $table->unsignedBigInteger('destination_wallet_id');
            $table->date('transfer_date');
            $table->bigInteger('amount');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign(['source_wallet_id', 'user_id'])->references(['id', 'user_id'])->on('wallets')->restrictOnDelete();
            $table->foreign(['destination_wallet_id', 'user_id'])->references(['id', 'user_id'])->on('wallets')->restrictOnDelete();

            $table->index(['user_id', 'transfer_date']);
        });

        DB::statement('ALTER TABLE transfers ADD CONSTRAINT transfers_amount_chk CHECK (amount > 0)');
        DB::statement('ALTER TABLE transfers ADD CONSTRAINT transfers_diff_chk CHECK (source_wallet_id <> destination_wallet_id)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transfers');
    }
};
