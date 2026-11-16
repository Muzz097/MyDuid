<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withHeaders(['Origin' => 'http://localhost:5173', 'Accept' => 'application/json']);
});

it('membuat, membaca, memperbarui, mengarsipkan, dan menghapus kategori', function () {
    $user = User::factory()->create();

    $id = $this->actingAs($user)->postJson('/api/categories', [
        'name' => 'Makanan',
        'type' => 'expense',
        'icon_key' => 'food',
    ])->assertCreated()
        ->assertJsonPath('data.name', 'Makanan')
        ->assertJsonPath('data.type', 'expense')
        ->assertJsonPath('data.icon_key', 'food')
        ->assertJsonPath('data.is_active', true)
        ->json('data.id');

    $this->getJson("/api/categories/{$id}")
        ->assertOk()
        ->assertJsonPath('data.name', 'Makanan');
    $this->getJson('/api/categories')->assertOk()->assertJsonCount(1, 'data');
    $this->putJson("/api/categories/{$id}", ['name' => 'Belanja', 'icon_key' => 'shopping'])
        ->assertOk()
        ->assertJsonPath('data.name', 'Belanja')
        ->assertJsonPath('data.type', 'expense');
    $this->patchJson("/api/categories/{$id}/archive")
        ->assertOk()
        ->assertJsonPath('data.is_active', false);
    $this->deleteJson("/api/categories/{$id}")->assertNoContent();
});

it('menolak permintaan kategori tanpa login', function () {
    $this->getJson('/api/categories')->assertUnauthorized();
});

it('user B tidak bisa melihat, mengubah, mengarsip, atau menghapus kategori user A', function () {
    $a = User::factory()->create();
    $b = User::factory()->create();
    $category = $a->categories()->create(['name' => 'Makanan', 'type' => 'expense']);

    $this->actingAs($b);
    $this->getJson("/api/categories/{$category->id}")->assertNotFound();
    $this->putJson("/api/categories/{$category->id}", ['name' => 'Curian'])->assertNotFound();
    $this->patchJson("/api/categories/{$category->id}/archive")->assertNotFound();
    $this->deleteJson("/api/categories/{$category->id}")->assertNotFound();

    expect($category->fresh()->name)->toBe('Makanan');
});

it('menjaga kategori pada user yang login meski body mengirim user_id', function () {
    $a = User::factory()->create();
    $b = User::factory()->create();

    $this->actingAs($a)->postJson('/api/categories', [
        'name' => 'Gaji',
        'type' => 'income',
        'user_id' => $b->id,
    ])->assertCreated();

    expect($a->categories()->count())->toBe(1)
        ->and($b->categories()->count())->toBe(0);
});

it('menolak nama duplikat pada user dan jenis yang sama, tetapi membolehkan jenis atau user lain', function () {
    $a = User::factory()->create();
    $b = User::factory()->create();
    $existing = $a->categories()->create(['name' => 'Bonus', 'type' => 'income']);
    $another = $a->categories()->create(['name' => 'Hadiah', 'type' => 'income']);

    $this->actingAs($a)->postJson('/api/categories', ['name' => 'Bonus', 'type' => 'income'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('name');
    $this->putJson("/api/categories/{$existing->id}", ['name' => 'Bonus'])->assertOk();
    $this->putJson("/api/categories/{$another->id}", ['name' => 'Bonus'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('name');
    $this->postJson('/api/categories', ['name' => 'Bonus', 'type' => 'expense'])->assertCreated();
    $this->actingAs($b)->postJson('/api/categories', ['name' => 'Bonus', 'type' => 'income'])->assertCreated();
});

it('tidak mengizinkan perubahan jenis kategori', function () {
    $user = User::factory()->create();
    $category = $user->categories()->create(['name' => 'Gaji', 'type' => 'income']);

    $this->actingAs($user)->putJson("/api/categories/{$category->id}", [
        'name' => 'Pendapatan',
        'type' => 'expense',
    ])->assertUnprocessable()->assertJsonValidationErrors('type');

    expect($category->fresh()->type)->toBe('income')
        ->and($category->fresh()->name)->toBe('Gaji');
});

it('menolak menghapus kategori yang pernah dipakai transaksi yang telah dihapus', function () {
    $user = User::factory()->create();
    $wallet = $user->wallets()->create([
        'name' => 'Kas',
        'type' => 'cash',
        'icon_type' => 'preset',
        'icon_key' => 'cash',
    ]);
    $category = $user->categories()->create(['name' => 'Makanan', 'type' => 'expense']);
    $transaction = $user->transactions()->create([
        'wallet_id' => $wallet->id,
        'category_id' => $category->id,
        'transaction_date' => '2026-11-15',
        'amount' => 1000,
        'type' => 'expense',
    ]);
    $transaction->delete();

    $this->actingAs($user)->deleteJson("/api/categories/{$category->id}")
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Kategori sudah digunakan, arsipkan saja.');
});

it('memfilter kategori berdasarkan jenis dan status aktif', function () {
    $user = User::factory()->create();
    $user->categories()->create(['name' => 'Zebra', 'type' => 'expense']);
    $user->categories()->create(['name' => 'Makan', 'type' => 'expense', 'is_active' => false]);
    $user->categories()->create(['name' => 'Bonus', 'type' => 'income']);

    $this->actingAs($user)->getJson('/api/categories?type=expense&active=1')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Zebra');
    $this->getJson('/api/categories?type=income')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Bonus');
    $this->getJson('/api/categories')
        ->assertOk()
        ->assertJsonPath('data.0.name', 'Makan')
        ->assertJsonPath('data.1.name', 'Zebra')
        ->assertJsonPath('data.2.name', 'Bonus');
});
