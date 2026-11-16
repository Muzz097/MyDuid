<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    /**
     * Data contoh kategori yang lolos CHECK constraint (type income/expense).
     *
     * user_id sengaja tidak diisi di sini: pemanggil wajib memberi user_id,
     * misalnya lewat ->for($user) atau ->create(['user_id' => $user->id]).
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => ucfirst(fake()->unique()->words(2, true)),
            'type' => fake()->randomElement(['income', 'expense']),
            'icon_key' => fake()->randomElement(['default', 'utensils', 'car', 'briefcase']),
            'is_active' => true,
        ];
    }
}
