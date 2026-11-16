<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Transaction>
 */
class TransactionFactory extends Factory
{
    /**
     * Data contoh transaksi dengan amount > 0 dan type mengikuti kategorinya.
     *
     * user_id, wallet_id, dan category_id sengaja tidak dibuat otomatis:
     * pemanggil wajib mengisinya dengan data milik user yang sama.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'transaction_date' => fake()->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
            'amount' => fake()->numberBetween(1_000, 1_000_000),
            'type' => function (array $attributes): string {
                $category = $attributes['category_id'] ?? null;

                if ($category instanceof Category) {
                    return $category->type;
                }

                if ($category !== null) {
                    return Category::find($category)?->type ?? 'expense';
                }

                return 'expense';
            },
            'notes' => fake()->boolean(60) ? fake()->sentence() : null,
        ];
    }
}
