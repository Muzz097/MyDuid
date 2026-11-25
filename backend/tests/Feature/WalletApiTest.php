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

it('group default adalah daily', function () {
    $u = User::factory()->create();

    $id = $this->actingAs($u)->postJson('/api/wallets', [
        'name' => 'Kas Harian', 'type' => 'cash',
    ])->assertCreated()->assertJsonPath('data.group', 'daily')->json('data.id');

    $this->getJson("/api/wallets/{$id}")->assertJsonPath('data.group', 'daily');
});

it('membuat dan mengubah dompet dengan group valid', function () {
    $u = User::factory()->create();

    $id = $this->actingAs($u)->postJson('/api/wallets', [
        'name' => 'Tabungan Liburan', 'type' => 'bank', 'group' => 'savings',
    ])->assertCreated()->assertJsonPath('data.group', 'savings')->json('data.id');

    $this->putJson("/api/wallets/{$id}", [
        'name' => 'Tabungan Liburan', 'type' => 'bank', 'icon_key' => 'bank', 'group' => 'investment',
    ])->assertOk()->assertJsonPath('data.group', 'investment');
});

it('menolak group tidak valid dengan 422', function () {
    $u = User::factory()->create();

    $this->actingAs($u)->postJson('/api/wallets', [
        'name' => 'X', 'type' => 'cash', 'group' => 'crypto',
    ])->assertStatus(422)->assertJsonValidationErrors('group');

    $w = $u->wallets()->create(['name' => 'Y', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);
    $this->putJson("/api/wallets/{$w->id}", [
        'name' => 'Y', 'type' => 'cash', 'icon_key' => 'cash', 'group' => 'gambling',
    ])->assertStatus(422)->assertJsonValidationErrors('group');
});

it('user B tidak bisa mengubah group dompet user A', function () {
    $a = User::factory()->create();
    $b = User::factory()->create();
    $w = $a->wallets()->create(['name' => 'A', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash', 'group' => 'daily']);

    $this->actingAs($b)->putJson("/api/wallets/{$w->id}", [
        'name' => 'A', 'type' => 'cash', 'icon_key' => 'cash', 'group' => 'savings',
    ])->assertNotFound();

    expect($w->fresh()->group)->toBe('daily');
});

it('group muncul di response list dan show', function () {
    $u = User::factory()->create();
    $u->wallets()->create(['name' => 'I', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash', 'group' => 'investment']);

    $this->actingAs($u)->getJson('/api/wallets')
        ->assertOk()
        ->assertJsonPath('data.0.group', 'investment');
});

it('membuat dan mengubah dompet dengan card_theme valid', function (string $theme) {
    $u = User::factory()->create();

    $id = $this->actingAs($u)->postJson('/api/wallets', [
        'name' => 'Kartu', 'type' => 'bank', 'card_theme' => $theme,
    ])->assertCreated()->assertJsonPath('data.card_theme', $theme)->json('data.id');

    $this->putJson("/api/wallets/{$id}", [
        'card_theme' => 'graphite',
    ])->assertOk()->assertJsonPath('data.card_theme', 'graphite');
})->with(['default', 'rose', 'ocean', 'emerald', 'sunset', 'graphite']);

it('menolak card_theme tidak valid dengan 422', function () {
    $u = User::factory()->create();

    $this->actingAs($u)->postJson('/api/wallets', [
        'name' => 'X', 'type' => 'cash', 'card_theme' => 'neon',
    ])->assertStatus(422)->assertJsonValidationErrors('card_theme');

    $w = $u->wallets()->create(['name' => 'Y', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);
    $this->putJson("/api/wallets/{$w->id}", [
        'card_theme' => 'gold',
    ])->assertStatus(422)->assertJsonValidationErrors('card_theme');
});

it('menerima ikon emoji valid dan menyimpan icon_type serta icon_key', function (string $emoji) {
    $u = User::factory()->create();

    $id = $this->actingAs($u)->postJson('/api/wallets', [
        'name' => 'Tabungan', 'type' => 'bank', 'icon_type' => 'emoji', 'icon_key' => $emoji,
    ])->assertCreated()
        ->assertJsonPath('data.icon_type', 'emoji')
        ->assertJsonPath('data.icon_key', $emoji)
        ->json('data.id');

    $this->getJson("/api/wallets/{$id}")
        ->assertOk()
        ->assertJsonPath('data.icon_type', 'emoji')
        ->assertJsonPath('data.icon_key', $emoji);
})->with(['💳', '❤️']);

it('menolak teks biasa, angka, dan dua emoji saat icon_type emoji', function (string $invalidEmoji) {
    $u = User::factory()->create();

    $this->actingAs($u)->postJson('/api/wallets', [
        'name' => 'X', 'type' => 'cash', 'icon_type' => 'emoji', 'icon_key' => $invalidEmoji,
    ])->assertStatus(422)->assertJsonValidationErrors('icon_key');

    $w = $u->wallets()->create(['name' => 'Y', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);
    $this->putJson("/api/wallets/{$w->id}", [
        'icon_type' => 'emoji', 'icon_key' => $invalidEmoji,
    ])->assertStatus(422)->assertJsonValidationErrors('icon_key');
})->with(['abc', '1', '💳💰', '💵a']);

it('bisa beralih antara ikon preset dan emoji saat update', function () {
    $u = User::factory()->create();
    $w = $u->wallets()->create(['name' => 'Dompet', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);

    $this->actingAs($u)->putJson("/api/wallets/{$w->id}", [
        'icon_type' => 'emoji', 'icon_key' => '🏦',
    ])->assertOk()
        ->assertJsonPath('data.icon_type', 'emoji')
        ->assertJsonPath('data.icon_key', '🏦');

    $this->putJson("/api/wallets/{$w->id}", [
        'icon_type' => 'preset', 'icon_key' => 'bank',
    ])->assertOk()
        ->assertJsonPath('data.icon_type', 'preset')
        ->assertJsonPath('data.icon_key', 'bank');

    $this->putJson("/api/wallets/{$w->id}", [
        'icon_type' => 'preset', 'icon_key' => '🏦',
    ])->assertStatus(422)->assertJsonValidationErrors('icon_key');
});

it('user B mendapat 404 saat mengubah tema atau ikon dompet user A', function () {
    $a = User::factory()->create();
    $b = User::factory()->create();
    $w = $a->wallets()->create([
        'name' => 'A', 'type' => 'cash', 'card_theme' => 'default', 'icon_type' => 'preset', 'icon_key' => 'cash',
    ]);

    $this->actingAs($b)->putJson("/api/wallets/{$w->id}", [
        'card_theme' => 'ocean', 'icon_type' => 'emoji', 'icon_key' => '💳',
    ])->assertNotFound();

    expect($w->fresh()->card_theme)->toBe('default')
        ->and($w->fresh()->icon_type)->toBe('preset')
        ->and($w->fresh()->icon_key)->toBe('cash');
});

it('update dompet tidak mengubah opening_balance atau saldo', function () {
    $u = User::factory()->create();
    $w = $u->wallets()->create([
        'name' => 'Kas', 'type' => 'cash', 'opening_balance' => 250000, 'icon_type' => 'preset', 'icon_key' => 'cash',
    ]);

    $this->actingAs($u)->putJson("/api/wallets/{$w->id}", [
        'name' => 'Kas Utama', 'opening_balance' => 9999999,
    ])->assertOk()
        ->assertJsonPath('data.name', 'Kas Utama')
        ->assertJsonPath('data.opening_balance', 250000)
        ->assertJsonPath('data.balance', 250000);

    expect($w->fresh()->opening_balance)->toBe(250000);
});
