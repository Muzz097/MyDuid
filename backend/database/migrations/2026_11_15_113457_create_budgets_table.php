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
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('category_id')->nullable();
            $table->unsignedBigInteger('wallet_id')->nullable();
            $table->smallInteger('year');
            $table->smallInteger('month');
            $table->bigInteger('limit_amount');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign(['category_id', 'user_id'])->references(['id', 'user_id'])->on('categories')->restrictOnDelete();
            $table->foreign(['wallet_id', 'user_id'])->references(['id', 'user_id'])->on('wallets')->restrictOnDelete();

            $table->index(['user_id', 'year', 'month']);
        });

        DB::statement('ALTER TABLE budgets ADD CONSTRAINT budgets_scope_chk CHECK (category_id IS NOT NULL OR wallet_id IS NOT NULL)');
        DB::statement('ALTER TABLE budgets ADD CONSTRAINT budgets_limit_chk CHECK (limit_amount > 0)');
        DB::statement('ALTER TABLE budgets ADD CONSTRAINT budgets_month_chk CHECK (month BETWEEN 1 AND 12)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};
