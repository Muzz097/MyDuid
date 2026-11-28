<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withHeaders(['Origin' => 'http://localhost:5173', 'Accept' => 'application/json']);
});

function wrappedBaseSetup(User $u): array
{
    $w1 = $u->wallets()->create([
        'name' => 'BCA',
        'type' => 'bank',
        'opening_balance' => 5000000,
        'icon_type' => 'preset',
        'icon_key' => 'bank',
        'is_active' => true,
    ]);
    $w2 = $u->wallets()->create([
        'name' => 'Tunai',
        'type' => 'cash',
        'opening_balance' => 500000,
        'icon_type' => 'preset',
        'icon_key' => 'cash',
        'is_active' => true,
    ]);

    $cFood = $u->categories()->create(['name' => 'Makan', 'type' => 'expense', 'icon_key' => 'food']);
    $cTransport = $u->categories()->create(['name' => 'Transportasi', 'type' => 'expense', 'icon_key' => 'transport']);
    $cShopping = $u->categories()->create(['name' => 'Belanja', 'type' => 'expense', 'icon_key' => 'shopping']);
    $cSalary = $u->categories()->create(['name' => 'Gaji', 'type' => 'income', 'icon_key' => 'salary']);

    return compact('w1', 'w2', 'cFood', 'cTransport', 'cShopping', 'cSalary');
}

it('menolak akses wrapped tanpa autentikasi', function () {
    $this->getJson('/api/reports/wrapped/months')->assertUnauthorized();
    $this->getJson('/api/reports/wrapped?month=2026-10')->assertUnauthorized();
});

it('mengembalikan daftar bulan selesai maksimal 12 urut terbaru dan upcoming yang benar', function () {
    $this->travelTo(now('Asia/Jakarta')->setDate(2026, 11, 15));

    $u = User::factory()->create();
    $s = wrappedBaseSetup($u);

    // 14 completed months (2025-09 through 2026-10)
    for ($i = 1; $i <= 14; $i++) {
        $dt = now('Asia/Jakarta')->setDate(2026, 11, 1)->subMonthsNoOverflow($i);
        $u->transactions()->create([
            'wallet_id' => $s['w1']->id,
            'category_id' => $s['cFood']->id,
            'type' => 'expense',
            'amount' => 10000,
            'transaction_date' => $dt->toDateString(),
        ]);
    }

    // Current month (2026-11) must NOT appear in months
    $u->transactions()->create([
        'wallet_id' => $s['w1']->id,
        'category_id' => $s['cFood']->id,
        'type' => 'expense',
        'amount' => 50000,
        'transaction_date' => '2026-11-05',
    ]);

    $d = $this->actingAs($u)
        ->getJson('/api/reports/wrapped/months')
        ->assertOk()
        ->json('data');

    expect($d['months'])->toHaveCount(12)
        ->and($d['months'][0]['month'])->toBe('2026-10')
        ->and($d['months'][0]['transaction_count'])->toBe(1)
        ->and($d['months'][11]['month'])->toBe('2025-11')
        ->and($d['upcoming'])->toBe([
            'month' => '2026-11',
            'available_at' => '2026-12-01',
        ]);
});

it('memvalidasi parameter bulan pada wrapped show dalam bahasa Indonesia', function () {
    $this->travelTo(now('Asia/Jakarta')->setDate(2026, 11, 15));
    $u = User::factory()->create();

    $this->actingAs($u)
        ->getJson('/api/reports/wrapped')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['month']);

    $this->actingAs($u)
        ->getJson('/api/reports/wrapped?month=2026-13')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['month']);

    $this->actingAs($u)
        ->getJson('/api/reports/wrapped?month=2026-11')
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Wrapped baru tersedia setelah bulan berakhir.');

    $this->actingAs($u)
        ->getJson('/api/reports/wrapped?month=2026-12')
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Wrapped baru tersedia setelah bulan berakhir.');
});

it('mengembalikan has_data false untuk bulan tanpa transaksi', function () {
    $this->travelTo(now('Asia/Jakarta')->setDate(2026, 11, 15));
    $u = User::factory()->create();

    $d = $this->actingAs($u)
        ->getJson('/api/reports/wrapped?month=2026-02')
        ->assertOk()
        ->json('data');

    expect($d['has_data'])->toBeFalse()
        ->and($d['month'])->toBe('2026-02')
        ->and($d['transaction_count'])->toBe(0)
        ->and($d['summary'])->toBeNull()
        ->and($d['top_categories'])->toBe([])
        ->and($d['most_frequent_category'])->toBeNull()
        ->and($d['biggest_day'])->toBeNull()
        ->and($d['frugal_day'])->toBeNull()
        ->and($d['no_spend_days'])->toBe(28)
        ->and($d['longest_no_spend_streak'])->toBe(28)
        ->and($d['daily_expense'])->toHaveCount(28)
        ->and($d['weekday_rhythm'])->toHaveCount(7)
        ->and($d['busiest_weekday'])->toBeNull()
        ->and($d['changes'])->toBe([])
        ->and($d['biggest_transaction'])->toBeNull()
        ->and($d['persona']['code'])->toBe('explorer')
        ->and($d['persona']['reason']['kind'])->toBe('not_enough_data');
});

it('mengembalikan payload wrapped lengkap dengan isolasi user, mengabaikan transfer & soft delete, tanpa notes', function () {
    $this->travelTo(now('Asia/Jakarta')->setDate(2026, 11, 15));
    $u = User::factory()->create();
    $s = wrappedBaseSetup($u);

    // Other user data must be isolated
    $other = User::factory()->create();
    $os = wrappedBaseSetup($other);
    $other->transactions()->create([
        'wallet_id' => $os['w1']->id,
        'category_id' => $os['cFood']->id,
        'type' => 'expense',
        'amount' => 999999,
        'transaction_date' => '2026-10-05',
        'notes' => 'Rahasia orang lain',
    ]);

    // Previous month (2026-09)
    $u->transactions()->create([
        'wallet_id' => $s['w1']->id,
        'category_id' => $s['cFood']->id,
        'type' => 'expense',
        'amount' => 400000,
        'transaction_date' => '2026-09-10',
    ]);

    // Target month (2026-10)
    $u->transactions()->create([
        'wallet_id' => $s['w1']->id,
        'category_id' => $s['cSalary']->id,
        'type' => 'income',
        'amount' => 3000000,
        'transaction_date' => '2026-10-01',
        'notes' => 'Gaji rahasia',
    ]);
    // 2026-10-02: 150k
    $u->transactions()->create([
        'wallet_id' => $s['w1']->id,
        'category_id' => $s['cFood']->id,
        'type' => 'expense',
        'amount' => 150000,
        'transaction_date' => '2026-10-02',
        'notes' => 'Catatan sensitif',
    ]);
    // 2026-10-03: 20k
    $u->transactions()->create([
        'wallet_id' => $s['w2']->id,
        'category_id' => $s['cTransport']->id,
        'type' => 'expense',
        'amount' => 20000,
        'transaction_date' => '2026-10-03',
    ]);
    // 2026-10-04: 30k
    $u->transactions()->create([
        'wallet_id' => $s['w2']->id,
        'category_id' => $s['cTransport']->id,
        'type' => 'expense',
        'amount' => 30000,
        'transaction_date' => '2026-10-04',
    ]);

    // Soft-deleted & transfer must be ignored
    $deleted = $u->transactions()->create([
        'wallet_id' => $s['w1']->id,
        'category_id' => $s['cFood']->id,
        'type' => 'expense',
        'amount' => 777777,
        'transaction_date' => '2026-10-05',
    ]);
    $deleted->delete();

    $u->transfers()->create([
        'source_wallet_id' => $s['w1']->id,
        'destination_wallet_id' => $s['w2']->id,
        'amount' => 500000,
        'transfer_date' => '2026-10-06',
    ]);

    $res = $this->actingAs($u)
        ->getJson('/api/reports/wrapped?month=2026-10')
        ->assertOk();

    $d = $res->json('data');

    expect($d['has_data'])->toBeTrue()
        ->and($d['transaction_count'])->toBe(4)
        ->and($d['summary']['income'])->toBe(3000000)
        ->and($d['summary']['expense'])->toBe(200000)
        ->and($d['summary']['net'])->toBe(2800000)
        ->and($d['biggest_day'])->toBe(['date' => '2026-10-02', 'amount' => 150000])
        ->and($d['frugal_day'])->toBe(['date' => '2026-10-03', 'amount' => 20000])
        ->and($d['no_spend_days'])->toBe(28)
        ->and($d['longest_no_spend_streak'])->toBe(27)
        ->and($d['daily_expense'])->toHaveCount(31)
        ->and($d['weekday_rhythm'])->toHaveCount(7)
        ->and($d['most_frequent_category']['name'])->toBe('Transportasi')
        ->and($d['most_frequent_category']['count'])->toBe(2)
        ->and($d['biggest_transaction']['amount'])->toBe(150000)
        ->and($d['biggest_transaction'])->not->toHaveKey('notes')
        ->and($d['logging'])->toBe(['days_with_records' => 4, 'longest_logging_streak' => 4])
        ->and($d['persona'])->toBe(['code' => 'explorer', 'reason' => ['kind' => 'not_enough_data']]);

    expect($res->getContent())->not->toContain('Catatan sensitif');
});

it('mengembalikan frugal_day null jika hari berpengeluaran kurang dari 3', function () {
    $this->travelTo(now('Asia/Jakarta')->setDate(2026, 11, 15));
    $u = User::factory()->create();
    $s = wrappedBaseSetup($u);

    $u->transactions()->create([
        'wallet_id' => $s['w1']->id,
        'category_id' => $s['cFood']->id,
        'type' => 'expense',
        'amount' => 50000,
        'transaction_date' => '2026-10-01',
    ]);
    $u->transactions()->create([
        'wallet_id' => $s['w1']->id,
        'category_id' => $s['cFood']->id,
        'type' => 'expense',
        'amount' => 60000,
        'transaction_date' => '2026-10-02',
    ]);

    $d = $this->actingAs($u)
        ->getJson('/api/reports/wrapped?month=2026-10')
        ->assertOk()
        ->json('data');

    expect($d['biggest_day'])->toBe(['date' => '2026-10-02', 'amount' => 60000])
        ->and($d['frugal_day'])->toBeNull();
});

it('menetapkan persona calm_saver dan memprioritaskannya di atas budget_keeper', function () {
    $this->travelTo(now('Asia/Jakarta')->setDate(2026, 11, 15));
    $u = User::factory()->create();
    $s = wrappedBaseSetup($u);

    // Previous month expense: 500k
    $u->transactions()->create([
        'wallet_id' => $s['w1']->id,
        'category_id' => $s['cFood']->id,
        'type' => 'expense',
        'amount' => 500000,
        'transaction_date' => '2026-09-10',
    ]);

    // Budget in 2026-10 (healthy)
    $u->budgets()->create([
        'category_id' => $s['cFood']->id,
        'year' => 2026,
        'month' => 10,
        'limit_amount' => 1000000,
    ]);

    // 2026-10: 1 income + 9 expenses = 10 tx, total expense 200k (< 500k), net > 0
    $u->transactions()->create([
        'wallet_id' => $s['w1']->id,
        'category_id' => $s['cSalary']->id,
        'type' => 'income',
        'amount' => 2000000,
        'transaction_date' => '2026-10-01',
    ]);
    for ($i = 1; $i <= 9; $i++) {
        $u->transactions()->create([
            'wallet_id' => $s['w1']->id,
            'category_id' => $s['cFood']->id,
            'type' => 'expense',
            'amount' => 20000,
            'transaction_date' => sprintf('2026-10-%02d', $i + 1),
        ]);
    }

    $d = $this->actingAs($u)
        ->getJson('/api/reports/wrapped?month=2026-10')
        ->assertOk()
        ->json('data');

    expect($d['persona']['code'])->toBe('calm_saver')
        ->and($d['budgets'])->toBe(['total' => 1, 'healthy' => 1, 'warning' => 0, 'over' => 0]);
});

it('menetapkan persona budget_keeper', function () {
    $this->travelTo(now('Asia/Jakarta')->setDate(2026, 11, 15));
    $u = User::factory()->create();
    $s = wrappedBaseSetup($u);

    $u->budgets()->create([
        'category_id' => $s['cFood']->id,
        'year' => 2026,
        'month' => 10,
        'limit_amount' => 500000,
    ]);

    for ($i = 1; $i <= 10; $i++) {
        $u->transactions()->create([
            'wallet_id' => $s['w1']->id,
            'category_id' => $s['cFood']->id,
            'type' => 'expense',
            'amount' => 10000,
            'transaction_date' => sprintf('2026-10-%02d', $i),
        ]);
    }

    $d = $this->actingAs($u)
        ->getJson('/api/reports/wrapped?month=2026-10')
        ->assertOk()
        ->json('data');

    expect($d['persona']['code'])->toBe('budget_keeper')
        ->and($d['persona']['reason'])->toBe(['total' => 1, 'healthy' => 1, 'warning' => 0]);
});

it('menetapkan persona recovery_month', function () {
    $this->travelTo(now('Asia/Jakarta')->setDate(2026, 11, 15));
    $u = User::factory()->create();
    $s = wrappedBaseSetup($u);

    $u->transactions()->create([
        'wallet_id' => $s['w1']->id,
        'category_id' => $s['cFood']->id,
        'type' => 'expense',
        'amount' => 500000,
        'transaction_date' => '2026-09-10',
    ]);

    for ($i = 1; $i <= 10; $i++) {
        $u->transactions()->create([
            'wallet_id' => $s['w1']->id,
            'category_id' => $s['cFood']->id,
            'type' => 'expense',
            'amount' => 10000,
            'transaction_date' => sprintf('2026-10-%02d', $i),
        ]);
    }

    $d = $this->actingAs($u)
        ->getJson('/api/reports/wrapped?month=2026-10')
        ->assertOk()
        ->json('data');

    expect($d['persona']['code'])->toBe('recovery_month')
        ->and($d['persona']['reason']['expense_change_percent'])->toBe(-80);
});

it('menetapkan persona moment_hunter', function () {
    $this->travelTo(now('Asia/Jakarta')->setDate(2026, 11, 15));
    $u = User::factory()->create();
    $s = wrappedBaseSetup($u);

    // 9 small expenses on days 1..9 (total 90k), 1 big expense on day 12 (110k -> 55% of 200k)
    for ($i = 1; $i <= 9; $i++) {
        $u->transactions()->create([
            'wallet_id' => $s['w1']->id,
            'category_id' => $s['cFood']->id,
            'type' => 'expense',
            'amount' => 10000,
            'transaction_date' => sprintf('2026-10-%02d', $i),
        ]);
    }
    $u->transactions()->create([
        'wallet_id' => $s['w1']->id,
        'category_id' => $s['cShopping']->id,
        'type' => 'expense',
        'amount' => 110000,
        'transaction_date' => '2026-10-12',
    ]);

    $d = $this->actingAs($u)
        ->getJson('/api/reports/wrapped?month=2026-10')
        ->assertOk()
        ->json('data');

    expect($d['persona']['code'])->toBe('moment_hunter')
        ->and($d['persona']['reason'])->toBe(['share_percent' => 55, 'date' => '2026-10-12']);
});

it('menetapkan persona weekend_king', function () {
    $this->travelTo(now('Asia/Jakarta')->setDate(2026, 11, 15));
    $u = User::factory()->create();
    $s = wrappedBaseSetup($u);

    // 2026-10-03 (Sat) & 2026-10-04 (Sun), 2026-10-10 (Sat), 2026-10-11 (Sun) -> 4 weekend tx @ 25k = 100k (50%)
    // 6 weekday tx @ ~16.6k -> let's use 10k each = 60k, plus 4 weekend @ 25k = 100k -> weekend 100/160 = 62%
    foreach (['2026-10-03', '2026-10-04', '2026-10-10', '2026-10-11'] as $dt) {
        $u->transactions()->create([
            'wallet_id' => $s['w1']->id,
            'category_id' => $s['cFood']->id,
            'type' => 'expense',
            'amount' => 25000,
            'transaction_date' => $dt,
        ]);
    }
    foreach (['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08'] as $dt) {
        $u->transactions()->create([
            'wallet_id' => $s['w1']->id,
            'category_id' => $s['cFood']->id,
            'type' => 'expense',
            'amount' => 10000,
            'transaction_date' => $dt,
        ]);
    }

    $d = $this->actingAs($u)
        ->getJson('/api/reports/wrapped?month=2026-10')
        ->assertOk()
        ->json('data');

    expect($d['persona']['code'])->toBe('weekend_king')
        ->and($d['persona']['reason']['weekend_share_percent'])->toBe(62);
});

it('menetapkan persona routine', function () {
    $this->travelTo(now('Asia/Jakarta')->setDate(2026, 11, 15));
    $u = User::factory()->create();
    $s = wrappedBaseSetup($u);

    // 30 weekday-heavy transactions across 22 weekdays in Oct 2026
    $weekdays = [];
    for ($day = 1; $day <= 31; $day++) {
        $dt = now('Asia/Jakarta')->setDate(2026, 10, $day);
        if (! $dt->isWeekend()) {
            $weekdays[] = $dt->toDateString();
        }
    }

    foreach ($weekdays as $idx => $dateStr) {
        $u->transactions()->create([
            'wallet_id' => $s['w1']->id,
            'category_id' => $s['cFood']->id,
            'type' => 'expense',
            'amount' => 10000,
            'transaction_date' => $dateStr,
        ]);
        if ($idx < 8) {
            $u->transactions()->create([
                'wallet_id' => $s['w1']->id,
                'category_id' => $s['cTransport']->id,
                'type' => 'expense',
                'amount' => 10000,
                'transaction_date' => $dateStr,
            ]);
        }
    }

    $d = $this->actingAs($u)
        ->getJson('/api/reports/wrapped?month=2026-10')
        ->assertOk()
        ->json('data');

    expect($d['persona']['code'])->toBe('routine')
        ->and($d['persona']['reason']['transaction_count'])->toBe(30)
        ->and($d['persona']['reason']['active_days'])->toBe(22);
});

it('menetapkan persona explorer fallback bila tidak ada pola dominan', function () {
    $this->travelTo(now('Asia/Jakarta')->setDate(2026, 11, 15));
    $u = User::factory()->create();
    $s = wrappedBaseSetup($u);

    // 10 weekday transactions, 10k each, no budget, no previous month
    $dates = [
        '2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06', '2026-10-07',
        '2026-10-08', '2026-10-09', '2026-10-12', '2026-10-13', '2026-10-14',
    ];
    foreach ($dates as $dt) {
        $u->transactions()->create([
            'wallet_id' => $s['w1']->id,
            'category_id' => $s['cFood']->id,
            'type' => 'expense',
            'amount' => 10000,
            'transaction_date' => $dt,
        ]);
    }

    $d = $this->actingAs($u)
        ->getJson('/api/reports/wrapped?month=2026-10')
        ->assertOk()
        ->json('data');

    expect($d['persona'])->toBe([
        'code' => 'explorer',
        'reason' => ['kind' => 'no_dominant_pattern'],
    ]);
});
