<?php

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withHeaders(['Origin' => 'http://localhost:5173', 'Accept' => 'application/json']);
});

function reportSeed(User $u): array
{
    $w1 = $u->wallets()->create([
        'name' => 'BCA',
        'type' => 'bank',
        'opening_balance' => 1000000,
        'icon_type' => 'preset',
        'icon_key' => 'bank',
        'is_active' => true,
    ]);
    $w2 = $u->wallets()->create([
        'name' => 'Tunai',
        'type' => 'cash',
        'opening_balance' => 200000,
        'icon_type' => 'preset',
        'icon_key' => 'cash',
        'is_active' => true,
    ]);
    $wArchivedActive = $u->wallets()->create([
        'name' => 'Dompet Lama',
        'type' => 'ewallet',
        'opening_balance' => 50000,
        'icon_type' => 'preset',
        'icon_key' => 'ewallet',
        'is_active' => false,
    ]);
    $wArchivedIdle = $u->wallets()->create([
        'name' => 'Dompet Kosong',
        'type' => 'cash',
        'opening_balance' => 0,
        'icon_type' => 'preset',
        'icon_key' => 'cash',
        'is_active' => false,
    ]);

    $cFood = $u->categories()->create(['name' => 'Makan', 'type' => 'expense', 'icon_key' => 'food']);
    $cTransport = $u->categories()->create(['name' => 'Transportasi', 'type' => 'expense', 'icon_key' => 'transport']);
    $cSalary = $u->categories()->create(['name' => 'Gaji', 'type' => 'income', 'icon_key' => 'salary']);

    // October 2026 (previous month)
    $u->transactions()->create([
        'wallet_id' => $w1->id, 'category_id' => $cSalary->id, 'type' => 'income',
        'amount' => 4000000, 'transaction_date' => '2026-10-01', 'notes' => 'Gaji Okt',
    ]);
    $u->transactions()->create([
        'wallet_id' => $w1->id, 'category_id' => $cFood->id, 'type' => 'expense',
        'amount' => 100000, 'transaction_date' => '2026-10-10', 'notes' => 'Makan Okt',
    ]);

    // November 2026 (current period)
    $u->transactions()->create([
        'wallet_id' => $w1->id, 'category_id' => $cSalary->id, 'type' => 'income',
        'amount' => 5000000, 'transaction_date' => '2026-11-01', 'notes' => 'Gaji Nov',
    ]);
    $u->transactions()->create([
        'wallet_id' => $w1->id, 'category_id' => $cFood->id, 'type' => 'expense',
        'amount' => 150000, 'transaction_date' => '2026-11-05', 'notes' => 'Makan Siang',
    ]);
    $u->transactions()->create([
        'wallet_id' => $w2->id, 'category_id' => $cTransport->id, 'type' => 'expense',
        'amount' => 50000, 'transaction_date' => '2026-11-05', 'notes' => 'Ojek',
    ]);
    $u->transactions()->create([
        'wallet_id' => $w2->id, 'category_id' => $cTransport->id, 'type' => 'expense',
        'amount' => 30000, 'transaction_date' => '2026-11-06', 'notes' => 'Parkir',
    ]);
    $u->transactions()->create([
        'wallet_id' => $wArchivedActive->id, 'category_id' => $cFood->id, 'type' => 'expense',
        'amount' => 20000, 'transaction_date' => '2026-11-08', 'notes' => 'Jajan',
    ]);

    // Soft-deleted transaction must be ignored
    $deleted = $u->transactions()->create([
        'wallet_id' => $w1->id, 'category_id' => $cFood->id, 'type' => 'expense',
        'amount' => 999000, 'transaction_date' => '2026-11-09', 'notes' => 'Dihapus',
    ]);
    $deleted->delete();

    // Transfer must not count as income or expense
    $u->transfers()->create([
        'source_wallet_id' => $w1->id,
        'destination_wallet_id' => $w2->id,
        'amount' => 300000,
        'transfer_date' => '2026-11-04',
        'notes' => 'Tarik tunai',
    ]);

    return compact('w1', 'w2', 'wArchivedActive', 'wArchivedIdle', 'cFood', 'cTransport', 'cSalary');
}

it('menolak akses laporan tanpa autentikasi', function () {
    $this->getJson('/api/reports/summary?from=2026-11-01&to=2026-11-30')->assertUnauthorized();
});

it('memvalidasi parameter periode laporan dalam bahasa Indonesia', function () {
    $u = User::factory()->create();

    $this->actingAs($u)
        ->getJson('/api/reports/summary?from=2026-11-10&to=2026-11-01')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['to']);

    $this->actingAs($u)
        ->getJson('/api/reports/summary?from=2025-01-01&to=2026-06-01')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['to']);
});

it('mengembalikan ringkasan laporan dengan pembanding bulan penuh dan mengabaikan transfer serta soft delete', function () {
    $u = User::factory()->create();
    reportSeed($u);

    // Another user's data must never be included
    $other = User::factory()->create();
    $ow = $other->wallets()->create(['name' => 'Other', 'type' => 'cash', 'opening_balance' => 0, 'icon_type' => 'preset', 'icon_key' => 'cash']);
    $oc = $other->categories()->create(['name' => 'Lain', 'type' => 'expense', 'icon_key' => 'other']);
    $other->transactions()->create(['wallet_id' => $ow->id, 'category_id' => $oc->id, 'type' => 'expense', 'amount' => 888888, 'transaction_date' => '2026-11-05']);

    $d = $this->actingAs($u)
        ->getJson('/api/reports/summary?from=2026-11-01&to=2026-11-30')
        ->assertOk()
        ->json('data');

    expect($d['income'])->toBe(5000000)
        ->and($d['expense'])->toBe(250000)
        ->and($d['net'])->toBe(4750000)
        ->and($d['transaction_count'])->toBe(5)
        ->and($d['has_data'])->toBeTrue()
        ->and($d['income_used_percent'])->toBe(5)
        ->and($d['income_remaining_percent'])->toBe(95)
        ->and($d['cash_flow'])->toBe('positive')
        ->and($d['comparison_basis'])->toBe('previous_month')
        ->and($d['previous']['from'])->toBe('2026-10-01')
        ->and($d['previous']['to'])->toBe('2026-10-31')
        ->and($d['previous']['income'])->toBe(4000000)
        ->and($d['previous']['expense'])->toBe(100000)
        ->and($d['previous']['income_change_percent'])->toBe(25)
        ->and($d['previous']['expense_change_percent'])->toBe(150);
});

it('menghitung periode pembanding yang adil untuk rentang parsial dan rentang arbitrer serta aman dari pembagian nol', function () {
    $u = User::factory()->create();

    $partial = $this->actingAs($u)
        ->getJson('/api/reports/summary?from=2026-11-01&to=2026-11-15')
        ->assertOk()
        ->json('data');

    expect($partial['has_data'])->toBeFalse()
        ->and($partial['income_used_percent'])->toBeNull()
        ->and($partial['cash_flow'])->toBe('zero')
        ->and($partial['comparison_basis'])->toBe('same_days_previous_month')
        ->and($partial['previous']['from'])->toBe('2026-10-01')
        ->and($partial['previous']['to'])->toBe('2026-10-15')
        ->and($partial['previous']['expense_change_percent'])->toBeNull();

    $custom = $this->actingAs($u)
        ->getJson('/api/reports/summary?from=2026-11-10&to=2026-11-16')
        ->assertOk()
        ->json('data');

    expect($custom['comparison_basis'])->toBe('previous_equal_period')
        ->and($custom['previous']['from'])->toBe('2026-11-03')
        ->and($custom['previous']['to'])->toBe('2026-11-09');
});

it('mengembalikan arus kas per hari dan per minggu senin-minggu dengan zero-fill penuh', function () {
    $u = User::factory()->create();
    reportSeed($u);

    $daily = collect($this->actingAs($u)
        ->getJson('/api/reports/cashflow?from=2026-11-01&to=2026-11-07&granularity=day')
        ->assertOk()
        ->json('data'));

    expect($daily)->toHaveCount(7)
        ->and($daily->first())->toBe(['from' => '2026-11-01', 'to' => '2026-11-01', 'income' => 5000000, 'expense' => 0])
        ->and($daily->firstWhere('from', '2026-11-05'))->toBe(['from' => '2026-11-05', 'to' => '2026-11-05', 'income' => 0, 'expense' => 200000])
        ->and($daily->firstWhere('from', '2026-11-03'))->toBe(['from' => '2026-11-03', 'to' => '2026-11-03', 'income' => 0, 'expense' => 0]);

    // 2026-11-01 is Sunday, so first bucket is 2026-11-01..2026-11-01, second is 2026-11-02..2026-11-08
    $weekly = $this->actingAs($u)
        ->getJson('/api/reports/cashflow?from=2026-11-01&to=2026-11-10&granularity=week')
        ->assertOk()
        ->json('data');

    expect($weekly)->toHaveCount(3)
        ->and($weekly[0])->toBe(['from' => '2026-11-01', 'to' => '2026-11-01', 'income' => 5000000, 'expense' => 0])
        ->and($weekly[1])->toBe(['from' => '2026-11-02', 'to' => '2026-11-08', 'income' => 0, 'expense' => 250000])
        ->and($weekly[2])->toBe(['from' => '2026-11-09', 'to' => '2026-11-10', 'income' => 0, 'expense' => 0]);
});

it('mengembalikan kategori terurut berdasarkan nominal dan jumlah transaksi secara terpisah', function () {
    $u = User::factory()->create();
    $seed = reportSeed($u);
    $u->transactions()->create([
        'wallet_id' => $seed['w2']->id, 'category_id' => $seed['cTransport']->id, 'type' => 'expense',
        'amount' => 10000, 'transaction_date' => '2026-11-07', 'notes' => 'Parkir 2',
    ]);

    $d = $this->actingAs($u)
        ->getJson('/api/reports/categories?from=2026-11-01&to=2026-11-30&type=expense')
        ->assertOk()
        ->json('data');

    expect($d['by_amount'][0]['name'])->toBe('Makan')
        ->and($d['by_amount'][0]['amount'])->toBe(170000)
        ->and($d['by_amount'][0]['count'])->toBe(2)
        ->and($d['by_amount'][0]['average'])->toBe(85000)
        ->and($d['by_amount'][0]['change_percent'])->toBe(70)
        ->and($d['by_count'][0]['name'])->toBe('Transportasi')
        ->and($d['by_count'][0]['count'])->toBe(3)
        ->and($d['by_count'][0]['amount'])->toBe(90000);
});

it('mengembalikan tren bulanan dan ritme hari dalam seminggu', function () {
    Carbon::setTestNow(Carbon::create(2026, 11, 20, 10, 0, 0, 'Asia/Jakarta'));

    $u = User::factory()->create();
    reportSeed($u);

    $d = $this->actingAs($u)
        ->getJson('/api/reports/trends?months=3')
        ->assertOk()
        ->json('data');

    expect($d['monthly'])->toHaveCount(3)
        ->and($d['monthly'][2]['month'])->toBe('2026-11')
        ->and($d['monthly'][2]['is_partial'])->toBeTrue()
        ->and($d['monthly'][1]['month'])->toBe('2026-10')
        ->and($d['monthly'][1]['is_partial'])->toBeFalse()
        ->and($d['highest_expense_month'])->toBe(['month' => '2026-10', 'expense' => 100000])
        ->and($d['weekday_rhythm'])->toHaveCount(7)
        ->and($d['weekday_rhythm'][0]['key'])->toBe('monday');

    Carbon::setTestNow();
});

it('mengembalikan laporan dompet dengan transfer terpisah dan menyertakan dompet arsip yang aktif pada periode', function () {
    $u = User::factory()->create();
    $seed = reportSeed($u);

    $wallets = collect($this->actingAs($u)
        ->getJson('/api/reports/wallets?from=2026-11-01&to=2026-11-30')
        ->assertOk()
        ->json('data'));

    expect($wallets->pluck('wallet_id')->all())->toBe([
        $seed['w1']->id,
        $seed['w2']->id,
        $seed['wArchivedActive']->id,
    ]);

    $bca = $wallets->firstWhere('wallet_id', $seed['w1']->id);
    expect($bca['income'])->toBe(5000000)
        ->and($bca['expense'])->toBe(150000)
        ->and($bca['transfer_out'])->toBe(300000)
        ->and($bca['transfer_in'])->toBe(0);
});

it('mengembalikan perbandingan periode dan kontributor perubahan terbesar', function () {
    $u = User::factory()->create();
    reportSeed($u);

    $d = $this->actingAs($u)
        ->getJson('/api/reports/comparison?from=2026-11-01&to=2026-11-30')
        ->assertOk()
        ->json('data');

    expect($d['contributors'])->toHaveCount(2)
        ->and($d['contributors'][0]['name'])->toBe('Transportasi')
        ->and($d['contributors'][0]['delta'])->toBe(80000)
        ->and($d['contributors'][0]['direction'])->toBe('up');
});

it('mengembalikan money story berdasarkan data aktual dan reason ketika kosong', function () {
    $u = User::factory()->create();
    reportSeed($u);

    $story = $this->actingAs($u)
        ->getJson('/api/reports/story?from=2026-11-01&to=2026-11-30')
        ->assertOk()
        ->json('data');

    expect($story['top_expense_category']['name'])->toBe('Makan')
        ->and($story['top_expense_category']['amount'])->toBe(170000)
        ->and($story['busiest_day'])->toBe(['date' => '2026-11-05', 'amount' => 200000])
        ->and($story['largest_expense']['amount'])->toBe(150000)
        ->and($story['largest_expense']['transaction_date'])->toBe('2026-11-05')
        ->and($story['expense_change'])->toBe(['percent' => 150, 'previous_amount' => 100000])
        ->and($story['reasons'])->toBe([]);

    $emptyStory = $this->actingAs($u)
        ->getJson('/api/reports/story?from=2026-01-01&to=2026-01-31')
        ->assertOk()
        ->json('data');

    expect($emptyStory['top_expense_category'])->toBeNull()
        ->and($emptyStory['busiest_day'])->toBeNull()
        ->and($emptyStory['largest_expense'])->toBeNull()
        ->and($emptyStory['expense_change'])->toBeNull()
        ->and($emptyStory['reasons'])->toMatchArray([
            'top_expense_category' => 'no_expense_in_period',
            'busiest_day' => 'no_expense_in_period',
            'largest_expense' => 'no_expense_in_period',
            'expense_change' => 'no_previous_expense',
        ]);
});
