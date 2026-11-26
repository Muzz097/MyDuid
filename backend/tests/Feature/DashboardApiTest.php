<?php

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withHeaders(['Origin' => 'http://localhost:5173', 'Accept' => 'application/json']);
});

/**
 * Seed one active wallet with November 2026 activity plus one October expense.
 */
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

    return ['wallet' => $w, 'expense_category' => $ce, 'income_category' => $ci];
}

it('menghitung ringkasan bulan dengan benar', function () {
    $u = User::factory()->create();
    dashSeed($u);

    $d = $this->actingAs($u)->getJson('/api/dashboard?month=2026-11')->assertOk()->json('data');

    expect($d['month'])->toBe('2026-11')
        ->and($d['income'])->toBe(500000)
        ->and($d['expense'])->toBe(40000)
        ->and($d['total_balance'])->toBe(100000 + 500000 - 40000 - 99000)
        ->and($d['expense_by_category'][0]['amount'])->toBe(40000)
        ->and($d['recent_transactions'])->toHaveCount(4);
});

it('mengembalikan arus kas harian penuh dengan hari tanpa transaksi bernilai nol', function () {
    $u = User::factory()->create();
    dashSeed($u);

    $daily = collect($this->actingAs($u)->getJson('/api/dashboard?month=2026-11')->json('data.daily_cash_flow'));

    expect($daily)->toHaveCount(30)
        ->and($daily->first())->toMatchArray(['date' => '2026-11-01', 'income' => 500000, 'expense' => 0])
        ->and($daily->firstWhere('date', '2026-11-05'))->toMatchArray(['income' => 0, 'expense' => 25000])
        ->and($daily->firstWhere('date', '2026-11-06'))->toMatchArray(['income' => 0, 'expense' => 15000])
        ->and($daily->firstWhere('date', '2026-11-07'))->toMatchArray(['income' => 0, 'expense' => 0])
        ->and($daily->last())->toMatchArray(['date' => '2026-11-30', 'income' => 0, 'expense' => 0])
        ->and($daily->sum('income'))->toBe(500000)
        ->and($daily->sum('expense'))->toBe(40000);
});

it('mengelompokkan pemasukan dan pengeluaran per kategori', function () {
    $u = User::factory()->create();
    $seed = dashSeed($u);
    $transport = $u->categories()->create(['name' => 'Transportasi', 'type' => 'expense', 'icon_key' => 'transport']);
    $u->transactions()->create([
        'wallet_id' => $seed['wallet']->id, 'category_id' => $transport->id,
        'type' => 'expense', 'amount' => 12000, 'transaction_date' => '2026-11-10',
    ]);
    $bonus = $u->categories()->create(['name' => 'Bonus', 'type' => 'income', 'icon_key' => 'gift']);
    $u->transactions()->create([
        'wallet_id' => $seed['wallet']->id, 'category_id' => $bonus->id,
        'type' => 'income', 'amount' => 20000, 'transaction_date' => '2026-11-11',
    ]);

    $d = $this->actingAs($u)->getJson('/api/dashboard?month=2026-11')->json('data');

    expect($d['expense_by_category'])->toHaveCount(2)
        ->and($d['expense_by_category'][0])->toBe([
            'category_id' => $seed['expense_category']->id,
            'name' => 'Makan',
            'icon_key' => 'food',
            'amount' => 40000,
        ])
        ->and($d['expense_by_category'][1]['name'])->toBe('Transportasi')
        ->and($d['expense_by_category'][1]['amount'])->toBe(12000)
        ->and($d['income_by_category'])->toHaveCount(2)
        ->and($d['income_by_category'][0]['name'])->toBe('Gaji')
        ->and($d['income_by_category'][0]['amount'])->toBe(500000)
        ->and($d['income_by_category'][0]['category_id'])->toBe($seed['income_category']->id)
        ->and($d['income_by_category'][0]['icon_key'])->toBe('salary')
        ->and($d['income_by_category'][1]['name'])->toBe('Bonus')
        ->and($d['income_by_category'][1]['amount'])->toBe(20000);
});

it('tidak menghitung transaksi soft-deleted pada ringkasan, arus kas, dan kategori', function () {
    $u = User::factory()->create();
    dashSeed($u);
    $u->transactions()->where('amount', 25000)->first()->delete();

    $d = $this->actingAs($u)->getJson('/api/dashboard?month=2026-11')->json('data');
    $daily = collect($d['daily_cash_flow']);

    expect($d['expense'])->toBe(15000)
        ->and($d['expense_by_category'][0]['amount'])->toBe(15000)
        ->and($daily->firstWhere('date', '2026-11-05')['expense'])->toBe(0)
        ->and($daily->sum('expense'))->toBe(15000);
});

it('tidak menghitung transfer sebagai pemasukan atau pengeluaran', function () {
    $u = User::factory()->create();
    $seed = dashSeed($u);
    $bank = $u->wallets()->create([
        'name' => 'Bank', 'type' => 'bank', 'opening_balance' => 0,
        'icon_type' => 'preset', 'icon_key' => 'bank',
    ]);
    $u->transfers()->create([
        'source_wallet_id' => $seed['wallet']->id,
        'destination_wallet_id' => $bank->id,
        'transfer_date' => '2026-11-10',
        'amount' => 70000,
    ]);

    $d = $this->actingAs($u)->getJson('/api/dashboard?month=2026-11')->json('data');
    $day = collect($d['daily_cash_flow'])->firstWhere('date', '2026-11-10');

    expect($d['income'])->toBe(500000)
        ->and($d['expense'])->toBe(40000)
        ->and($day)->toMatchArray(['income' => 0, 'expense' => 0])
        ->and($d['total_balance'])->toBe(100000 + 500000 - 40000 - 99000);
});

it('mengisolasi seluruh data dashboard antar pengguna', function () {
    $u = User::factory()->create();
    $b = User::factory()->create();
    dashSeed($u);
    dashSeed($b);

    $d = $this->actingAs($u)->getJson('/api/dashboard?month=2026-11')->json('data');

    expect($d['income'])->toBe(500000)
        ->and($d['expense'])->toBe(40000)
        ->and($d['income_by_category'])->toHaveCount(1)
        ->and($d['expense_by_category'])->toHaveCount(1)
        ->and($d['wallets'])->toHaveCount(1)
        ->and(collect($d['daily_cash_flow'])->sum('expense'))->toBe(40000);
});

it('mengembalikan bulan tanpa transaksi dengan nilai nol', function () {
    $u = User::factory()->create();
    dashSeed($u);

    $d = $this->actingAs($u)->getJson('/api/dashboard?month=2026-09')->assertOk()->json('data');
    $daily = collect($d['daily_cash_flow']);

    expect($d['month'])->toBe('2026-09')
        ->and($d['income'])->toBe(0)
        ->and($d['expense'])->toBe(0)
        ->and($d['income_by_category'])->toBe([])
        ->and($d['expense_by_category'])->toBe([])
        ->and($daily)->toHaveCount(30)
        ->and($daily->every(fn (array $day) => $day['income'] === 0 && $day['expense'] === 0))->toBeTrue();
});

it('memakai bulan berjalan zona Asia/Jakarta sebagai nilai bawaan', function () {
    $this->travelTo(Carbon::parse('2026-11-17 01:00:00', 'Asia/Jakarta'));
    $u = User::factory()->create();
    dashSeed($u);

    $d = $this->actingAs($u)->getJson('/api/dashboard')->assertOk()->json('data');

    expect($d['month'])->toBe('2026-11')
        ->and($d['expense'])->toBe(40000);
});

it('memerlukan login dan memvalidasi parameter bulan', function () {
    $this->getJson('/api/dashboard')->assertUnauthorized();

    $u = User::factory()->create();
    foreach (['salah', '2026-13', '2026-00', '2026-1', '2026-12-01'] as $month) {
        $this->actingAs($u)
            ->getJson('/api/dashboard?month='.$month)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('month');
    }
});

it('menyertakan metadata visual dan has_card_image pada daftar dompet dashboard', function () {
    $u = User::factory()->create();
    $u->wallets()->create([
        'name' => 'Dompet Foto',
        'type' => 'bank',
        'opening_balance' => 250000,
        'card_theme' => 'ocean',
        'icon_type' => 'preset',
        'icon_key' => 'bank',
        'card_image_path' => 'wallet-cards/1/test.webp',
    ]);
    $u->wallets()->create([
        'name' => 'Dompet Polos',
        'type' => 'cash',
        'opening_balance' => 50000,
    ]);

    $wallets = collect($this->actingAs($u)->getJson('/api/dashboard?month=2026-11')->assertOk()->json('data.wallets'));

    $withPhoto = $wallets->firstWhere('name', 'Dompet Foto');
    $plain = $wallets->firstWhere('name', 'Dompet Polos');

    expect($withPhoto)->toMatchArray([
        'card_theme' => 'ocean',
        'icon_type' => 'preset',
        'icon_key' => 'bank',
        'has_card_image' => true,
    ])->and($plain)->toMatchArray([
        'card_theme' => 'default',
        'has_card_image' => false,
    ]);
});
