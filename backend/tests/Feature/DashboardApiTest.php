<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withHeaders(['Origin' => 'http://localhost:5173', 'Accept' => 'application/json']);
});

function dashSeed(User $u): array
{
    $w = $u->wallets()->create(['name' => 'K', 'type' => 'cash', 'opening_balance' => 100000, 'icon_type' => 'preset', 'icon_key' => 'cash']);
    $ce = $u->categories()->create(['name' => 'Makan', 'type' => 'expense', 'icon_key' => 'food']);
    $ci = $u->categories()->create(['name' => 'Gaji', 'type' => 'income', 'icon_key' => 'salary']);
    $add = fn ($c, $t, $a, $d) => $u->transactions()->create([
        'wallet_id' => $w->id, 'category_id' => $c->id, 'type' => $t, 'amount' => $a, 'transaction_date' => $d,
    ]);
    $add($ci, 'income', 500000, '2026-11-01');
    $add($ce, 'expense', 25000, '2026-11-05');
    $add($ce, 'expense', 15000, '2026-11-06');
    $add($ce, 'expense', 99000, '2026-10-20');

    return [$w];
}

it('menghitung ringkasan bulan dengan benar', function () {
    $u = User::factory()->create();
    dashSeed($u);

    $d = $this->actingAs($u)->getJson('/api/dashboard?month=2026-11')->assertOk()->json('data');

    expect($d['income'])->toBe(500000)
        ->and($d['expense'])->toBe(40000)
        ->and($d['total_balance'])->toBe(100000 + 500000 - 40000 - 99000)
        ->and($d['expense_by_category'][0]['amount'])->toBe(40000)
        ->and($d['recent_transactions'])->toHaveCount(4);
});

it('tidak menghitung transaksi soft-deleted dan data user lain', function () {
    $u = User::factory()->create();
    $b = User::factory()->create();
    dashSeed($u);
    dashSeed($b);
    $u->transactions()->where('amount', 25000)->first()->delete();

    $d = $this->actingAs($u)->getJson('/api/dashboard?month=2026-11')->json('data');

    expect($d['expense'])->toBe(15000)->and($d['wallets'])->toHaveCount(1);
});

it('memerlukan login dan memvalidasi format bulan', function () {
    $this->getJson('/api/dashboard')->assertUnauthorized();
    $this->actingAs(User::factory()->create())->getJson('/api/dashboard?month=salah')->assertStatus(422);
});
