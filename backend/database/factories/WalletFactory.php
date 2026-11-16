<?php

namespace Database\Factories;

use App\Models\Wallet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Wallet>
 */
class WalletFactory extends Factory
{
    /**
     * Data contoh dompet yang lolos CHECK constraint (type dan icon preset).
     *
     * user_id sengaja tidak diisi di sini: pemanggil wajib memberi user_id,
     * misalnya lewat ->for($user) atau ->create(['user_id' => $user->id]).
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'type' => fake()->randomElement(['cash', 'bank', 'ewallet']),
            'opening_balance' => fake()->numberBetween(0, 10_000_000),
            'icon_type' => 'preset',
            'icon_key' => fake()->randomElement(['wallet', 'landmark', 'smartphone', 'credit-card']),
            'icon_path' => null,
            'is_active' => true,
        ];
    }
}
