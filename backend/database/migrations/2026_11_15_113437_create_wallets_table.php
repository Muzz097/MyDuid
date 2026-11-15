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
        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 60);
            $table->string('type', 20); // cash | bank | ewallet
            $table->bigInteger('opening_balance')->default(0);
            $table->string('icon_type', 10)->default('preset'); // preset | custom
            $table->string('icon_key', 40)->nullable();
            $table->string('icon_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['id', 'user_id']); // dipakai composite FK
            $table->index(['user_id', 'is_active']);
        });

        DB::statement("ALTER TABLE wallets ADD CONSTRAINT wallets_type_chk CHECK (type IN ('cash','bank','ewallet'))");
        DB::statement("ALTER TABLE wallets ADD CONSTRAINT wallets_icon_chk CHECK (
    (icon_type = 'preset' AND icon_key IS NOT NULL AND icon_path IS NULL) OR
    (icon_type = 'custom' AND icon_path IS NOT NULL)
)");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallets');
    }
};
