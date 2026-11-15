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
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 60);
            $table->string('type', 10); // income | expense
            $table->string('icon_key', 40)->default('default');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['id', 'user_id']);
            $table->unique(['user_id', 'type', 'name']);
        });

        DB::statement("ALTER TABLE categories ADD CONSTRAINT categories_type_chk CHECK (type IN ('income','expense'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
