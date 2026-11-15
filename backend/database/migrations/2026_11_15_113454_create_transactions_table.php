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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('wallet_id');
            $table->unsignedBigInteger('category_id');
            $table->date('transaction_date');
            $table->bigInteger('amount');
            $table->string('type', 10);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign(['wallet_id', 'user_id'])->references(['id', 'user_id'])->on('wallets')->restrictOnDelete();
            $table->foreign(['category_id', 'user_id'])->references(['id', 'user_id'])->on('categories')->restrictOnDelete();

            $table->index(['user_id', 'transaction_date']);
            $table->index(['wallet_id', 'transaction_date']);
        });

        DB::statement('ALTER TABLE transactions ADD CONSTRAINT transactions_amount_chk CHECK (amount > 0)');
        DB::statement("ALTER TABLE transactions ADD CONSTRAINT transactions_type_chk CHECK (type IN ('income','expense'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
