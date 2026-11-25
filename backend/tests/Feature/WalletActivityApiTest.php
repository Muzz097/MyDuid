<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withHeaders(['Origin' => 'http://localhost:5173', 'Accept' => 'application/json']);
});

function setupUserWithWallets(): array
{
    $user = User::factory()->create();
    $walletA = $user->wallets()->create(['name' => 'Kas', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);
    $walletB = $user->wallets()->create(['name' => 'Bank', 'type' => 'bank', 'icon_type' => 'preset', 'icon_key' => 'landmark']);
    $catIncome = $user->categories()->create(['name' => 'Gaji', 'type' => 'income', 'icon_key' => 'briefcase']);
    $catExpense = $user->categories()->create(['name' => 'Makan', 'type' => 'expense', 'icon_key' => 'utensils']);

    return compact('user', 'walletA', 'walletB', 'catIncome', 'catExpense');
}

it('menggabungkan transaksi dan transfer dalam urutan yang benar', function () {
    ['user' => $u, 'walletA' => $wA, 'walletB' => $wB, 'catIncome' => $cI, 'catExpense' => $cE] = setupUserWithWallets();

    // Create transactions and transfers with specific dates for ordering
    $u->transactions()->create([
        'wallet_id' => $wA->id, 'category_id' => $cI->id,
        'transaction_date' => '2026-11-20', 'amount' => 500000, 'type' => 'income',
    ]);
    $u->transactions()->create([
        'wallet_id' => $wA->id, 'category_id' => $cE->id,
        'transaction_date' => '2026-11-20', 'amount' => 50000, 'type' => 'expense',
    ]);
    $u->transfers()->create([
        'source_wallet_id' => $wA->id, 'destination_wallet_id' => $wB->id,
        'transfer_date' => '2026-11-21', 'amount' => 100000,
    ]);

    $this->actingAs($u);

    $response = $this->getJson("/api/wallets/{$wA->id}/activity")
        ->assertOk()
        ->assertJsonCount(3, 'data');

    $data = $response->json('data');

    // Transfer on 21 Nov should come first (newest)
    expect($data[0]['kind'])->toBe('transfer')
        ->and($data[0]['date'])->toBe('2026-11-21')
        ->and($data[0]['amount'])->toBe(100000);

    // Then the two transactions on 20 Nov, ordered by id desc
    expect($data[1]['kind'])->toBe('transaction')
        ->and($data[1]['date'])->toBe('2026-11-20');
    expect($data[2]['kind'])->toBe('transaction')
        ->and($data[2]['date'])->toBe('2026-11-20');

    // The expense (created second, higher id) should come before income
    expect($data[1]['type'])->toBe('expense')
        ->and($data[2]['type'])->toBe('income');
});

it('menampilkan arah masuk dan keluar transfer dengan benar', function () {
    ['user' => $u, 'walletA' => $wA, 'walletB' => $wB] = setupUserWithWallets();

    $u->transfers()->create([
        'source_wallet_id' => $wA->id, 'destination_wallet_id' => $wB->id,
        'transfer_date' => '2026-11-20', 'amount' => 200000,
    ]);

    $this->actingAs($u);

    // From walletA perspective: outgoing
    $res = $this->getJson("/api/wallets/{$wA->id}/activity")->assertOk();
    $item = $res->json('data.0');
    expect($item['direction'])->toBe('out')
        ->and($item['counterparty_wallet']['id'])->toBe($wB->id)
        ->and($item['counterparty_wallet']['name'])->toBe('Bank');

    // From walletB perspective: incoming
    $res = $this->getJson("/api/wallets/{$wB->id}/activity")->assertOk();
    $item = $res->json('data.0');
    expect($item['direction'])->toBe('in')
        ->and($item['counterparty_wallet']['id'])->toBe($wA->id)
        ->and($item['counterparty_wallet']['name'])->toBe('Kas');
});

it('tidak menampilkan data soft-deleted', function () {
    ['user' => $u, 'walletA' => $wA, 'walletB' => $wB, 'catExpense' => $cE] = setupUserWithWallets();

    $tx = $u->transactions()->create([
        'wallet_id' => $wA->id, 'category_id' => $cE->id,
        'transaction_date' => '2026-11-20', 'amount' => 25000, 'type' => 'expense',
    ]);
    $tr = $u->transfers()->create([
        'source_wallet_id' => $wA->id, 'destination_wallet_id' => $wB->id,
        'transfer_date' => '2026-11-20', 'amount' => 50000,
    ]);

    // Soft-delete both
    $tx->delete();
    $tr->delete();

    $this->actingAs($u)
        ->getJson("/api/wallets/{$wA->id}/activity")
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

it('user B mendapat 404 untuk dompet user A', function () {
    ['user' => $userA, 'walletA' => $wA] = setupUserWithWallets();
    $userB = User::factory()->create();

    $this->actingAs($userB)
        ->getJson("/api/wallets/{$wA->id}/activity")
        ->assertNotFound();
});

it('memfilter berdasarkan bulan', function () {
    ['user' => $u, 'walletA' => $wA, 'catIncome' => $cI] = setupUserWithWallets();

    $u->transactions()->create([
        'wallet_id' => $wA->id, 'category_id' => $cI->id,
        'transaction_date' => '2026-11-15', 'amount' => 100000, 'type' => 'income',
    ]);
    $u->transactions()->create([
        'wallet_id' => $wA->id, 'category_id' => $cI->id,
        'transaction_date' => '2026-10-15', 'amount' => 200000, 'type' => 'income',
    ]);

    $this->actingAs($u);

    $this->getJson("/api/wallets/{$wA->id}/activity?month=2026-11")
        ->assertOk()
        ->assertJsonCount(1, 'data');

    $this->getJson("/api/wallets/{$wA->id}/activity?month=2026-10")
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('memfilter berdasarkan tipe', function () {
    ['user' => $u, 'walletA' => $wA, 'walletB' => $wB, 'catIncome' => $cI, 'catExpense' => $cE] = setupUserWithWallets();

    $u->transactions()->create([
        'wallet_id' => $wA->id, 'category_id' => $cI->id,
        'transaction_date' => '2026-11-20', 'amount' => 100000, 'type' => 'income',
    ]);
    $u->transactions()->create([
        'wallet_id' => $wA->id, 'category_id' => $cE->id,
        'transaction_date' => '2026-11-20', 'amount' => 50000, 'type' => 'expense',
    ]);
    $u->transfers()->create([
        'source_wallet_id' => $wA->id, 'destination_wallet_id' => $wB->id,
        'transfer_date' => '2026-11-20', 'amount' => 75000,
    ]);

    $this->actingAs($u);

    $this->getJson("/api/wallets/{$wA->id}/activity?type=income")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.type', 'income');

    $this->getJson("/api/wallets/{$wA->id}/activity?type=expense")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.type', 'expense');

    $this->getJson("/api/wallets/{$wA->id}/activity?type=transfer")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.kind', 'transfer');

    $this->getJson("/api/wallets/{$wA->id}/activity?type=all")
        ->assertOk()
        ->assertJsonCount(3, 'data');
});

it('menolak tanpa login', function () {
    $this->getJson('/api/wallets/1/activity')
        ->assertUnauthorized();
});

it('menolak format bulan yang salah', function () {
    ['user' => $u, 'walletA' => $wA] = setupUserWithWallets();

    $this->actingAs($u)
        ->getJson("/api/wallets/{$wA->id}/activity?month=november")
        ->assertStatus(422)
        ->assertJsonValidationErrors('month');
});

it('mengembalikan resource transaction dengan kategori', function () {
    ['user' => $u, 'walletA' => $wA, 'catIncome' => $cI] = setupUserWithWallets();

    $u->transactions()->create([
        'wallet_id' => $wA->id, 'category_id' => $cI->id,
        'transaction_date' => '2026-11-20', 'amount' => 300000, 'type' => 'income',
        'notes' => 'Gaji bulanan',
    ]);

    $this->actingAs($u);

    $res = $this->getJson("/api/wallets/{$wA->id}/activity")->assertOk();
    $item = $res->json('data.0');

    expect($item['kind'])->toBe('transaction')
        ->and($item['amount'])->toBe(300000)
        ->and($item['notes'])->toBe('Gaji bulanan')
        ->and($item['type'])->toBe('income')
        ->and($item['category']['id'])->toBe($cI->id)
        ->and($item['category']['name'])->toBe('Gaji')
        ->and($item['category']['icon_key'])->toBe('briefcase');
});

it('mendukung paginasi', function () {
    ['user' => $u, 'walletA' => $wA, 'catExpense' => $cE] = setupUserWithWallets();

    // Create 25 transactions
    for ($i = 1; $i <= 25; $i++) {
        $u->transactions()->create([
            'wallet_id' => $wA->id, 'category_id' => $cE->id,
            'transaction_date' => sprintf('2026-11-%02d', min($i, 28)),
            'amount' => $i * 1000, 'type' => 'expense',
        ]);
    }

    $this->actingAs($u);

    $page1 = $this->getJson("/api/wallets/{$wA->id}/activity")->assertOk();
    expect($page1->json('data'))->toHaveCount(20)
        ->and($page1->json('meta.current_page'))->toBe(1)
        ->and($page1->json('meta.last_page'))->toBe(2)
        ->and($page1->json('meta.total'))->toBe(25);

    $page2 = $this->getJson("/api/wallets/{$wA->id}/activity?page=2")->assertOk();
    expect($page2->json('data'))->toHaveCount(5)
        ->and($page2->json('meta.current_page'))->toBe(2);
});
