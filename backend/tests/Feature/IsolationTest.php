<?php

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->a = User::factory()->create();
    $this->b = User::factory()->create();

    $mk = fn (User $u, string $n) => $u->wallets()->create([
        'name' => $n, 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash',
    ]);

    $this->wa = $mk($this->a, 'W1');
    $this->wa2 = $mk($this->a, 'W2');
    $this->wb = $mk($this->b, 'WB');
    $this->ca = $this->a->categories()->create(['name' => 'M', 'type' => 'expense']);
    $this->cb = $this->b->categories()->create(['name' => 'M', 'type' => 'expense']);
});

function isoTxData(object $t, array $over = []): array
{
    return array_merge([
        'wallet_id' => $t->wa->id, 'category_id' => $t->ca->id,
        'transaction_date' => '2026-11-15', 'amount' => 1000, 'type' => 'expense',
    ], $over);
}

it('menolak transaksi ke dompet user lain', function () {
    expect(fn () => $this->a->transactions()->create(isoTxData($this, ['wallet_id' => $this->wb->id])))
        ->toThrow(QueryException::class);
});

it('menolak transaksi ke kategori user lain', function () {
    expect(fn () => $this->a->transactions()->create(isoTxData($this, ['category_id' => $this->cb->id])))
        ->toThrow(QueryException::class);
});

it('menolak amount nol dan negatif pada transaksi', function (int $amount) {
    expect(fn () => $this->a->transactions()->create(isoTxData($this, ['amount' => $amount])))
        ->toThrow(QueryException::class);
})->with([0, -5]);

it('menolak type selain income/expense', function () {
    expect(fn () => $this->a->transactions()->create(isoTxData($this, ['type' => 'lain'])))
        ->toThrow(QueryException::class);
});

it('menolak amount nol pada transfer', function () {
    expect(fn () => $this->a->transfers()->create([
        'source_wallet_id' => $this->wa->id, 'destination_wallet_id' => $this->wa2->id,
        'amount' => 0, 'transfer_date' => '2026-11-15',
    ]))->toThrow(QueryException::class);
});

it('menolak transfer ke dompet sendiri', function () {
    expect(fn () => $this->a->transfers()->create([
        'source_wallet_id' => $this->wa->id, 'destination_wallet_id' => $this->wa->id,
        'amount' => 100, 'transfer_date' => '2026-11-15',
    ]))->toThrow(QueryException::class);
});

it('menolak transfer ke dompet user lain', function () {
    expect(fn () => $this->a->transfers()->create([
        'source_wallet_id' => $this->wa->id, 'destination_wallet_id' => $this->wb->id,
        'amount' => 100, 'transfer_date' => '2026-11-15',
    ]))->toThrow(QueryException::class);
});

it('menolak anggaran tidak valid', function (array $data) {
    expect(fn () => $this->a->budgets()->create(array_merge(
        ['category_id' => $this->ca->id, 'year' => 2026, 'month' => 11, 'limit_amount' => 1000],
        $data,
    )))->toThrow(QueryException::class);
})->with([
    'tanpa kategori & dompet' => [['category_id' => null, 'wallet_id' => null]],
    'limit nol' => [['limit_amount' => 0]],
    'bulan 13' => [['month' => 13]],
]);

it('menolak ikon dompet yang tidak konsisten', function (array $data) {
    expect(fn () => $this->a->wallets()->create(array_merge(['name' => 'X', 'type' => 'cash'], $data)))
        ->toThrow(QueryException::class);
})->with([
    'preset tanpa key' => [['icon_type' => 'preset', 'icon_key' => null]],
    'custom tanpa path' => [['icon_type' => 'custom', 'icon_key' => null, 'icon_path' => null]],
]);

it('menolak menghapus dompet yang punya transaksi', function () {
    $this->a->transactions()->create(isoTxData($this));
    expect(fn () => $this->wa->delete())->toThrow(QueryException::class);
});
