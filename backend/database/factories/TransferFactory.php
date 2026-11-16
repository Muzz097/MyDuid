<?php

namespace Database\Factories;

use App\Models\Transfer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Transfer>
 */
class TransferFactory extends Factory
{
    /**
     * Data contoh transfer dengan amount > 0.
     *
     * user_id, source_wallet_id, dan destination_wallet_id sengaja tidak dibuat
     * otomatis: pemanggil wajib mengisi dua dompet berbeda milik user yang sama.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'transfer_date' => fake()->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
            'amount' => fake()->numberBetween(1_000, 1_000_000),
            'notes' => fake()->boolean(50) ? fake()->sentence() : null,
        ];
    }
}
