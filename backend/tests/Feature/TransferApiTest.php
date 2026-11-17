<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withHeaders(['Origin' => 'http://localhost:5173', 'Accept' => 'application/json']);
    $this->u = User::factory()->create();
    $mk = fn (string $n, int $o) => $this->u->wallets()->create([
        'name' => $n, 'type' => 'cash', 'opening_balance' => $o, 'icon_type' => 'preset', 'icon_key' => 'cash',
    ]);
    $this->kas = $mk('Kas', 500000);
    $this->bca = $mk('BCA', 1000000);
});

function trBody(object $t, array $o = []): array
{
    return array_merge([
        'source_wallet_id' => $t->kas->id, 'destination_wallet_id' => $t->bca->id,
        'amount' => 100000, 'transfer_date' => '2026-11-15',
    ], $o);
}

function walletBalance(object $t, int $id): int
{
    return $t->getJson("/api/wallets/{$id}")->json('data.balance');
}

it('memindahkan saldo tanpa mengubah total', function () {
    $this->actingAs($this->u)->postJson('/api/transfers', trBody($this))->assertCreated();

    expect(walletBalance($this, $this->kas->id))->toBe(400000)
        ->and(walletBalance($this, $this->bca->id))->toBe(1100000)
        ->and(walletBalance($this, $this->kas->id) + walletBalance($this, $this->bca->id))->toBe(1500000);
});

it('tidak muncul sebagai transaksi pemasukan atau pengeluaran', function () {
    $this->actingAs($this->u)->postJson('/api/transfers', trBody($this))->assertCreated();
    $this->getJson('/api/transactions')->assertJsonCount(0, 'data');
});

it('menolak dompet user lain, dompet sama, dan nominal tidak valid', function () {
    $b = User::factory()->create();
    $wb = $b->wallets()->create(['name' => 'B', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);

    $this->actingAs($this->u);
    $this->postJson('/api/transfers', trBody($this, ['destination_wallet_id' => $wb->id]))->assertStatus(422);
    $this->postJson('/api/transfers', trBody($this, ['source_wallet_id' => $wb->id]))->assertStatus(422);
    $this->postJson('/api/transfers', trBody($this, ['destination_wallet_id' => $this->kas->id]))->assertStatus(422);
    foreach ([0, -1, 10.5] as $amt) {
        $this->postJson('/api/transfers', trBody($this, ['amount' => $amt]))->assertStatus(422);
    }
    expect($this->u->transfers()->count())->toBe(0);
});

it('soft delete mengembalikan kedua saldo dan restore menghitung lagi', function () {
    $this->actingAs($this->u);
    $id = $this->postJson('/api/transfers', trBody($this))->json('data.id');

    $this->deleteJson("/api/transfers/{$id}")->assertNoContent();
    expect(walletBalance($this, $this->kas->id))->toBe(500000)
        ->and(walletBalance($this, $this->bca->id))->toBe(1000000);

    $this->postJson("/api/transfers/{$id}/restore")->assertOk();
    expect(walletBalance($this, $this->kas->id))->toBe(400000);
});

it('user B tidak bisa melihat, menghapus, atau restore transfer user A', function () {
    $this->actingAs($this->u);
    $id = $this->postJson('/api/transfers', trBody($this))->json('data.id');
    $this->deleteJson("/api/transfers/{$id}");

    $this->actingAs(User::factory()->create());
    $this->getJson("/api/transfers/{$id}")->assertNotFound();
    $this->deleteJson("/api/transfers/{$id}")->assertNotFound();
    $this->postJson("/api/transfers/{$id}/restore")->assertNotFound();
    $this->getJson('/api/transfers')->assertJsonCount(0, 'data');
});

it('mengabaikan user_id dari body dan memerlukan login', function () {
    $b = User::factory()->create();
    $this->actingAs($this->u)->postJson('/api/transfers', trBody($this, ['user_id' => $b->id]))->assertCreated();
    expect($this->u->transfers()->count())->toBe(1)->and($b->transfers()->count())->toBe(0);

    $this->app['auth']->forgetGuards();
    $this->getJson('/api/transfers')->assertUnauthorized();
});
