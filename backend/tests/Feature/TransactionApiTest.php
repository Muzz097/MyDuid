<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withHeaders(['Origin' => 'http://localhost:5173', 'Accept' => 'application/json']);
    $this->u = User::factory()->create();
    $this->w = $this->u->wallets()->create(['name' => 'K', 'type' => 'cash', 'opening_balance' => 100000, 'icon_type' => 'preset', 'icon_key' => 'cash']);
    $this->ce = $this->u->categories()->create(['name' => 'Makan', 'type' => 'expense']);
    $this->ci = $this->u->categories()->create(['name' => 'Gaji', 'type' => 'income']);
});

function txBody(object $t, array $o = []): array
{
    return array_merge([
        'wallet_id' => $t->w->id, 'category_id' => $t->ce->id, 'type' => 'expense',
        'amount' => 25000, 'transaction_date' => '2026-11-15',
    ], $o);
}

it('membuat transaksi dan saldo dompet berkurang', function () {
    $this->actingAs($this->u)->postJson('/api/transactions', txBody($this))
        ->assertCreated()->assertJsonPath('data.amount', 25000);

    $this->getJson("/api/wallets/{$this->w->id}")->assertJsonPath('data.balance', 75000);
});

it('soft delete mengembalikan saldo dan restore menghitung lagi', function () {
    $this->actingAs($this->u);
    $id = $this->postJson('/api/transactions', txBody($this))->json('data.id');

    $this->deleteJson("/api/transactions/{$id}")->assertNoContent();
    $this->getJson("/api/wallets/{$this->w->id}")->assertJsonPath('data.balance', 100000);

    $this->postJson("/api/transactions/{$id}/restore")->assertOk();
    $this->getJson("/api/wallets/{$this->w->id}")->assertJsonPath('data.balance', 75000);
});

it('user B tidak bisa melihat, mengubah, menghapus, atau restore transaksi user A', function () {
    $this->actingAs($this->u);
    $id = $this->postJson('/api/transactions', txBody($this))->json('data.id');
    $this->deleteJson("/api/transactions/{$id}");

    $b = User::factory()->create();
    $this->actingAs($b);
    $this->getJson("/api/transactions/{$id}")->assertNotFound();
    $this->putJson("/api/transactions/{$id}", ['amount' => 1])->assertNotFound();
    $this->deleteJson("/api/transactions/{$id}")->assertNotFound();
    $this->postJson("/api/transactions/{$id}/restore")->assertNotFound();
    $this->getJson('/api/transactions')->assertJsonCount(0, 'data');
});

it('menolak dompet atau kategori milik user lain', function () {
    $b = User::factory()->create();
    $wb = $b->wallets()->create(['name' => 'B', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);
    $cb = $b->categories()->create(['name' => 'X', 'type' => 'expense']);

    $this->actingAs($this->u);
    $this->postJson('/api/transactions', txBody($this, ['wallet_id' => $wb->id]))->assertStatus(422)->assertJsonValidationErrors('wallet_id');
    $this->postJson('/api/transactions', txBody($this, ['category_id' => $cb->id]))->assertStatus(422)->assertJsonValidationErrors('category_id');
});

it('menolak jenis transaksi yang tidak cocok dengan kategori', function () {
    $this->actingAs($this->u)
        ->postJson('/api/transactions', txBody($this, ['type' => 'income']))
        ->assertStatus(422)->assertJsonValidationErrors('category_id');
});

it('menolak nominal nol, negatif, desimal', function (mixed $amt) {
    $this->actingAs($this->u)->postJson('/api/transactions', txBody($this, ['amount' => $amt]))
        ->assertStatus(422)->assertJsonValidationErrors('amount');
})->with([0, -5, 10.5]);

it('menolak tanggal masa depan', function () {
    $this->actingAs($this->u)->postJson('/api/transactions', txBody($this, ['transaction_date' => '2099-01-01']))
        ->assertStatus(422)->assertJsonValidationErrors('transaction_date');
});

it('mengabaikan user_id dari body', function () {
    $b = User::factory()->create();
    $this->actingAs($this->u)->postJson('/api/transactions', txBody($this, ['user_id' => $b->id]))->assertCreated();
    expect($this->u->transactions()->count())->toBe(1)->and($b->transactions()->count())->toBe(0);
});

it('memfilter berdasarkan bulan', function () {
    $this->actingAs($this->u);
    $this->postJson('/api/transactions', txBody($this, ['transaction_date' => '2026-10-10']));
    $this->postJson('/api/transactions', txBody($this, ['transaction_date' => '2026-11-10']));

    $this->getJson('/api/transactions?month=2026-11')->assertJsonCount(1, 'data');
});

it('memerlukan login', function () {
    $this->getJson('/api/transactions')->assertUnauthorized();
});
