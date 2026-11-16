<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withHeaders(['Origin' => 'http://localhost:5173', 'Accept' => 'application/json']);
});

it('membuat dan membaca dompet dengan saldo benar', function () {
    $u = User::factory()->create();

    $id = $this->actingAs($u)->postJson('/api/wallets', [
        'name' => 'Kas', 'type' => 'cash', 'opening_balance' => 500000,
    ])->assertCreated()->assertJsonPath('data.balance', 500000)->json('data.id');

    $this->getJson("/api/wallets/{$id}")->assertOk()->assertJsonPath('data.name', 'Kas');
    $this->getJson('/api/wallets')->assertOk()->assertJsonCount(1, 'data');
});

it('menolak tanpa login', function () {
    $this->getJson('/api/wallets')->assertUnauthorized();
});

it('user B tidak bisa melihat, mengubah, mengarsip, atau menghapus dompet user A', function () {
    $a = User::factory()->create();
    $b = User::factory()->create();
    $w = $a->wallets()->create(['name' => 'A', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);

    $this->actingAs($b);
    $this->getJson("/api/wallets/{$w->id}")->assertNotFound();
    $this->putJson("/api/wallets/{$w->id}", ['name' => 'Curian'])->assertNotFound();
    $this->patchJson("/api/wallets/{$w->id}/archive")->assertNotFound();
    $this->deleteJson("/api/wallets/{$w->id}")->assertNotFound();
    $this->getJson('/api/wallets')->assertJsonCount(0, 'data');

    expect($w->fresh()->name)->toBe('A');
});

it('mengabaikan user_id dari body', function () {
    $a = User::factory()->create();
    $b = User::factory()->create();

    $this->actingAs($a)->postJson('/api/wallets', [
        'name' => 'X', 'type' => 'cash', 'user_id' => $b->id,
    ])->assertCreated();

    expect($a->wallets()->count())->toBe(1)->and($b->wallets()->count())->toBe(0);
});

it('menolak saldo awal negatif dan desimal', function (mixed $val) {
    $this->actingAs(User::factory()->create())
        ->postJson('/api/wallets', ['name' => 'X', 'type' => 'cash', 'opening_balance' => $val])
        ->assertStatus(422)->assertJsonValidationErrors('opening_balance');
})->with([-1, 10.5]);

it('menolak menghapus dompet berriwayat tetapi boleh mengarsipkan', function () {
    $u = User::factory()->create();
    $w = $u->wallets()->create(['name' => 'K', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);
    $c = $u->categories()->create(['name' => 'M', 'type' => 'expense']);
    $u->transactions()->create([
        'wallet_id' => $w->id, 'category_id' => $c->id,
        'transaction_date' => '2026-11-15', 'amount' => 1000, 'type' => 'expense',
    ]);

    $this->actingAs($u);
    $this->deleteJson("/api/wallets/{$w->id}")->assertStatus(422);
    $this->patchJson("/api/wallets/{$w->id}/archive")->assertOk()->assertJsonPath('data.is_active', false);
});

it('saldo di response mengikuti transaksi', function () {
    $u = User::factory()->create();
    $w = $u->wallets()->create(['name' => 'K', 'type' => 'cash', 'opening_balance' => 10000, 'icon_type' => 'preset', 'icon_key' => 'cash']);
    $c = $u->categories()->create(['name' => 'M', 'type' => 'expense']);
    $u->transactions()->create([
        'wallet_id' => $w->id, 'category_id' => $c->id,
        'transaction_date' => '2026-11-15', 'amount' => 2500, 'type' => 'expense',
    ]);

    $this->actingAs($u)->getJson("/api/wallets/{$w->id}")->assertJsonPath('data.balance', 7500);
});
