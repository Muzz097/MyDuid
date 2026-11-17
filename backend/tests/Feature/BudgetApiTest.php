<?php

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withHeaders(['Origin' => 'http://localhost:5173', 'Accept' => 'application/json']);
    $this->u = User::factory()->create();
    $this->w = $this->u->wallets()->create([
        'name' => 'Kas',
        'type' => 'cash',
        'opening_balance' => 100000,
        'icon_type' => 'preset',
        'icon_key' => 'cash',
    ]);
    $this->ce = $this->u->categories()->create(['name' => 'Makan', 'type' => 'expense', 'icon_key' => 'food']);
    $this->ci = $this->u->categories()->create(['name' => 'Gaji', 'type' => 'income']);
});

function budgetApiBody(object $test, array $overrides = []): array
{
    return array_merge([
        'category_id' => $test->ce->id,
        'wallet_id' => $test->w->id,
        'year' => 2026,
        'month' => 11,
        'limit_amount' => 100000,
    ], $overrides);
}

function createBudgetTransaction(User $user, int $walletId, int $categoryId, string $type, string $date, int $amount)
{
    return $user->transactions()->create([
        'wallet_id' => $walletId,
        'category_id' => $categoryId,
        'type' => $type,
        'transaction_date' => $date,
        'amount' => $amount,
    ]);
}

it('membuat, menampilkan, memfilter, mengubah, dan menghapus anggaran', function () {
    $this->actingAs($this->u);
    $id = $this->postJson('/api/budgets', budgetApiBody($this))
        ->assertCreated()
        ->assertJsonPath('data.category.name', 'Makan')
        ->assertJsonPath('data.category.icon_key', 'food')
        ->assertJsonPath('data.wallet.name', 'Kas')
        ->assertJsonPath('data.spent', 0)
        ->assertJsonPath('data.remaining', 100000)
        ->assertJsonPath('data.percent', 0)
        ->assertJsonPath('data.status', 'healthy')
        ->json('data.id');

    $this->getJson("/api/budgets/{$id}")->assertOk()->assertJsonPath('data.id', $id);
    $this->getJson('/api/budgets?month=2026-11')->assertOk()->assertJsonCount(1, 'data');
    $this->getJson('/api/budgets?month=2026-10')->assertOk()->assertJsonCount(0, 'data');

    $this->putJson("/api/budgets/{$id}", [
        'limit_amount' => 150000,
        'year' => 2025,
        'month' => 1,
        'category_id' => null,
        'wallet_id' => null,
    ])->assertOk()
        ->assertJsonPath('data.limit_amount', 150000)
        ->assertJsonPath('data.year', 2026)
        ->assertJsonPath('data.month', 11)
        ->assertJsonPath('data.category_id', $this->ce->id)
        ->assertJsonPath('data.wallet_id', $this->w->id);

    $this->deleteJson("/api/budgets/{$id}")->assertNoContent();
    expect($this->u->budgets()->count())->toBe(0);
});

it('menggunakan bulan berjalan zona Jakarta sebagai filter index bawaan', function () {
    $this->travelTo(Carbon::parse('2026-11-17 01:00:00', 'Asia/Jakarta'));
    $this->actingAs($this->u);
    $this->u->budgets()->create(budgetApiBody($this));
    $this->u->budgets()->create(budgetApiBody($this, ['month' => 10]));

    $this->getJson('/api/budgets')->assertOk()->assertJsonCount(1, 'data');
});

it('menghitung pengeluaran aktif sesuai filter kategori, dompet, dan bulan saja', function () {
    $otherWallet = $this->u->wallets()->create([
        'name' => 'Bank',
        'type' => 'bank',
        'icon_type' => 'preset',
        'icon_key' => 'bank',
    ]);
    $otherCategory = $this->u->categories()->create(['name' => 'Transportasi', 'type' => 'expense']);

    $accepted = createBudgetTransaction($this->u, $this->w->id, $this->ce->id, 'expense', '2026-11-01', 25000);
    createBudgetTransaction($this->u, $otherWallet->id, $this->ce->id, 'expense', '2026-11-15', 15000);
    createBudgetTransaction($this->u, $this->w->id, $otherCategory->id, 'expense', '2026-11-30', 10000);
    createBudgetTransaction($this->u, $this->w->id, $this->ci->id, 'income', '2026-11-10', 90000);
    $deleted = createBudgetTransaction($this->u, $this->w->id, $this->ce->id, 'expense', '2026-11-10', 5000);
    $deleted->delete();
    createBudgetTransaction($this->u, $this->w->id, $this->ce->id, 'expense', '2026-10-31', 6000);
    $this->u->transfers()->create([
        'source_wallet_id' => $this->w->id,
        'destination_wallet_id' => $otherWallet->id,
        'transfer_date' => '2026-11-20',
        'amount' => 70000,
    ]);

    $this->u->budgets()->create(budgetApiBody($this));
    $this->u->budgets()->create(budgetApiBody($this, ['wallet_id' => null]));
    $this->u->budgets()->create(budgetApiBody($this, ['category_id' => null]));

    $items = $this->actingAs($this->u)->getJson('/api/budgets?month=2026-11')->assertOk()->json('data');
    $byScope = collect($items)->keyBy(fn (array $budget) => $budget['category_id'] === null
        ? 'wallet'
        : ($budget['wallet_id'] === null ? 'category' : 'both'));

    expect($byScope['both']['spent'])->toBe(25000)
        ->and($byScope['category']['spent'])->toBe(40000)
        ->and($byScope['wallet']['spent'])->toBe(35000);
});

it('menghitung status healthy, warning, dan over dengan persentase integer', function () {
    foreach ([1 => 799, 2 => 800, 3 => 1001] as $month => $amount) {
        createBudgetTransaction($this->u, $this->w->id, $this->ce->id, 'expense', sprintf('2026-%02d-15', $month), $amount);
        $this->u->budgets()->create(budgetApiBody($this, ['category_id' => null, 'month' => $month, 'limit_amount' => 1000]));
    }

    $items = $this->actingAs($this->u)->getJson('/api/budgets?month=2026-01')->assertOk()->json('data');
    expect($items[0]['status'])->toBe('healthy')
        ->and($items[0]['percent'])->toBe(79);

    $items = $this->getJson('/api/budgets?month=2026-02')->assertOk()->json('data');
    expect($items[0]['status'])->toBe('warning')
        ->and($items[0]['percent'])->toBe(80);

    $items = $this->getJson('/api/budgets?month=2026-03')->assertOk()->json('data');
    expect($items[0]['status'])->toBe('over')
        ->and($items[0]['percent'])->toBe(100)
        ->and($items[0]['remaining'])->toBe(-1);
});

it('mengembalikan 404 untuk anggaran milik pengguna lain', function () {
    $budget = $this->u->budgets()->create(budgetApiBody($this));

    $this->actingAs(User::factory()->create());
    $this->getJson("/api/budgets/{$budget->id}")->assertNotFound();
    $this->putJson("/api/budgets/{$budget->id}", ['limit_amount' => 500])->assertNotFound();
    $this->deleteJson("/api/budgets/{$budget->id}")->assertNotFound();
});

it('menolak kategori atau dompet pengguna lain dan kategori income', function () {
    $otherUser = User::factory()->create();
    $otherWallet = $otherUser->wallets()->create([
        'name' => 'Dompet lain',
        'type' => 'cash',
        'icon_type' => 'preset',
        'icon_key' => 'cash',
    ]);
    $otherCategory = $otherUser->categories()->create(['name' => 'Kategori lain', 'type' => 'expense']);

    $this->actingAs($this->u);
    $this->postJson('/api/budgets', budgetApiBody($this, ['category_id' => $otherCategory->id]))
        ->assertUnprocessable()->assertJsonValidationErrors('category_id');
    $this->postJson('/api/budgets', budgetApiBody($this, ['wallet_id' => $otherWallet->id]))
        ->assertUnprocessable()->assertJsonValidationErrors('wallet_id');
    $this->postJson('/api/budgets', budgetApiBody($this, ['category_id' => $this->ci->id]))
        ->assertUnprocessable()->assertJsonValidationErrors('category_id');
});

it('menolak anggaran duplikat termasuk kombinasi dengan nilai null', function () {
    $this->actingAs($this->u);
    $body = budgetApiBody($this, ['category_id' => null]);
    $this->postJson('/api/budgets', $body)->assertCreated();

    $this->postJson('/api/budgets', $body)
        ->assertUnprocessable()->assertJsonValidationErrors('month');
});

it('memerlukan kategori atau dompet dan menampilkan pesan validasi yang ditentukan', function () {
    $this->actingAs($this->u)->postJson('/api/budgets', budgetApiBody($this, [
        'category_id' => null,
        'wallet_id' => null,
    ]))->assertUnprocessable()
        ->assertJsonValidationErrors('category_id')
        ->assertJsonPath('errors.category_id.0', 'Pilih kategori, dompet, atau keduanya.');
});

it('memerlukan login untuk API anggaran', function () {
    $this->getJson('/api/budgets')->assertUnauthorized();
});
