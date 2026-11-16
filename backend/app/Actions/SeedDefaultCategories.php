<?php

namespace App\Actions;

use App\Models\User;

class SeedDefaultCategories
{
    private const DEFAULTS = [
        ['Makanan', 'expense', 'food'],
        ['Transport', 'expense', 'transport'],
        ['Belanja', 'expense', 'shopping'],
        ['Hiburan', 'expense', 'entertainment'],
        ['Gaji', 'income', 'salary'],
        ['Bonus', 'income', 'bonus'],
    ];

    public function __invoke(User $user): void
    {
        foreach (self::DEFAULTS as [$name, $type, $icon]) {
            $user->categories()->create(['name' => $name, 'type' => $type, 'icon_key' => $icon]);
        }
    }
}
