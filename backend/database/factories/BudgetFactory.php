<?php

namespace Database\Factories;

use App\Models\Budget;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Budget>
 */
class BudgetFactory extends Factory
{
    /**
     * Data contoh anggaran dengan limit > 0 dan bulan 1-12.
     *
     * user_id serta minimal salah satu dari category_id/wallet_id sengaja tidak
     * dibuat otomatis: pemanggil wajib mengisinya (CHECK budgets_scope_chk).
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'year' => (int) now()->format('Y'),
            'month' => (int) now()->format('n'),
            'limit_amount' => fake()->numberBetween(100_000, 5_000_000),
        ];
    }
}
