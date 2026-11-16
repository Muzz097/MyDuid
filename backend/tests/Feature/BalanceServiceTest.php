<?php

use App\Models\User;
use App\Services\BalanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function makeUserWithWallet(int $opening = 0): array
{
    $u = User::factory()->create();
    $w = $u->wallets()->create([
        'name' => 'Kas', 'type' => 'cash', 'opening_balance' => $opening,
        'icon_type' => 'preset', 'icon_key' => 'cash',
    ]);
    $c = $u->categories()->create(['name' => 'Umum', 'type' => 'expense']);
    $ci = $u->categories()->create(['name' => 'Gaji', 'type' => 'income']);

    return [$u, $w, $c, $ci];
}

function addTx($u, $w, $c, string $type, int $amount)
{
    return $u->transactions()->create([
        'wallet_id' => $w->id, 'category_id' => $c->id, 'type' => $type,
        'amount' => $amount, 'transaction_date' => '2026-11-15',
    ]);
}

it('menghitung saldo awal saja', function () {
    [, $w] = makeUserWithWallet(500_000);
    expect(app(BalanceService::class)->forWallet($w))->toBe(500_000);
});

it('mengikuti skenario dokumen = 1.125.000', function () {
    [$u, $w, $c, $ci] = makeUserWithWallet(1_000_000);
    $lain = $u->wallets()->create(['name' => 'BCA', 'type' => 'bank', 'icon_type' => 'preset', 'icon_key' => 'bank']);

    addTx($u, $w, $ci, 'income', 200_000);
    addTx($u, $w, $c, 'expense', 75_000);
    $u->transfers()->create(['source_wallet_id' => $lain->id, 'destination_wallet_id' => $w->id, 'amount' => 100_000, 'transfer_date' => '2026-11-15']);
    $u->transfers()->create(['source_wallet_id' => $w->id, 'destination_wallet_id' => $lain->id, 'amount' => 100_000, 'transfer_date' => '2026-11-15']);

    expect(app(BalanceService::class)->forWallet($w))->toBe(1_125_000);
});

it('tidak menghitung transaksi dan transfer yang soft-deleted', function () {
    [$u, $w, $c] = makeUserWithWallet(1_000);
    $lain = $u->wallets()->create(['name' => 'B', 'type' => 'bank', 'icon_type' => 'preset', 'icon_key' => 'bank']);

    addTx($u, $w, $c, 'expense', 400)->delete();
    $u->transfers()->create(['source_wallet_id' => $w->id, 'destination_wallet_id' => $lain->id, 'amount' => 300, 'transfer_date' => '2026-11-15'])->delete();

    expect(app(BalanceService::class)->forWallet($w))->toBe(1_000);
});

it('forWallets cocok dengan forWallet dan tidak mencampur user lain', function () {
    [$u, $w, $c] = makeUserWithWallet(1_000);
    [$u2, $w2, $c2] = makeUserWithWallet(9_000);
    addTx($u, $w, $c, 'expense', 100);
    addTx($u2, $w2, $c2, 'expense', 5_000);

    $svc = app(BalanceService::class);
    $map = $svc->forWallets($u->wallets()->get());

    expect($map)->toBe([$w->id => 900])
        ->and($svc->forWallet($w))->toBe(900)
        ->and($svc->totalForUser($u))->toBe(900);
});
