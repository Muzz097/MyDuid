<?php

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withHeaders(['Origin' => 'http://localhost:5173', 'Accept' => 'application/json']);
    $this->u = User::factory()->create();

    // Dompet Tabungan milik pengguna
    $this->savings = $this->u->wallets()->create([
        'name'            => 'Dana Darurat',
        'type'            => 'bank',
        'group'           => 'savings',
        'opening_balance' => 0,
        'icon_type'       => 'preset',
        'icon_key'        => 'bank',
    ]);

    // Dompet sehari-hari (bukan tabungan)
    $this->daily = $this->u->wallets()->create([
        'name'      => 'Kas',
        'type'      => 'cash',
        'group'     => 'daily',
        'icon_type' => 'preset',
        'icon_key'  => 'cash',
    ]);

    // Kategori untuk transaksi
    $this->cat = $this->u->categories()->create(['name' => 'Gaji', 'type' => 'income', 'icon_key' => 'income']);
});

// ─── Helpers ───────────────────────────────────────────────────────────────

function goalBody(array $overrides = []): array
{
    return array_merge([
        'name'          => 'Dana Darurat',
        'target_amount' => 10_000_000,
    ], $overrides);
}

function addIncome(object $test, int $amount, string $date = '2026-01-15'): void
{
    $test->u->transactions()->create([
        'wallet_id'        => $test->savings->id,
        'category_id'      => $test->cat->id,
        'type'             => 'income',
        'transaction_date' => $date,
        'amount'           => $amount,
    ]);
}

// ─── CRUD dasar ────────────────────────────────────────────────────────────

it('membuat, menampilkan, mengubah, dan menghapus goal', function () {
    $this->actingAs($this->u);
    $walletId = $this->savings->id;

    // POST — buat goal
    $this->postJson("/api/wallets/{$walletId}/goal", goalBody())
        ->assertCreated()
        ->assertJsonPath('data.name', 'Dana Darurat')
        ->assertJsonPath('data.target_amount', 10_000_000)
        ->assertJsonPath('data.balance', 0)
        ->assertJsonPath('data.percent', 0)
        ->assertJsonPath('data.remaining', 10_000_000)
        ->assertJsonPath('data.achieved', false)
        ->assertJsonPath('data.deadline', null)
        ->assertJsonPath('data.deadline_info', null);

    // GET — tampilkan goal
    $this->getJson("/api/wallets/{$walletId}/goal")
        ->assertOk()
        ->assertJsonPath('data.name', 'Dana Darurat');

    // PUT — ubah nama dan target
    $this->putJson("/api/wallets/{$walletId}/goal", [
        'name'          => 'Liburan',
        'target_amount' => 5_000_000,
    ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Liburan')
        ->assertJsonPath('data.target_amount', 5_000_000);

    // DELETE — hapus goal
    $this->deleteJson("/api/wallets/{$walletId}/goal")->assertNoContent();

    // GET setelah hapus — 404
    $this->getJson("/api/wallets/{$walletId}/goal")->assertNotFound();
});

// ─── Progres & persentase ──────────────────────────────────────────────────

it('menghitung progres dari saldo aktual dompet', function () {
    $this->actingAs($this->u);
    $walletId = $this->savings->id;

    // Tabung 3 juta dari 10 juta target
    addIncome($this, 3_000_000);

    $this->u->walletGoals()->create(array_merge(goalBody(), ['wallet_id' => $walletId]));

    $data = $this->getJson("/api/wallets/{$walletId}/goal")->assertOk()->json('data');

    expect($data['balance'])->toBe(3_000_000)
        ->and($data['percent'])->toBe(30)                // floor(3_000_000 * 100 / 10_000_000)
        ->and($data['remaining'])->toBe(7_000_000)
        ->and($data['achieved'])->toBeFalse();
});

it('membatasi persentase maksimum 100 dan sisa minimum 0 saat saldo melampaui target', function () {
    $this->actingAs($this->u);
    $walletId = $this->savings->id;

    addIncome($this, 15_000_000); // melampaui target 10 juta

    $this->u->walletGoals()->create(array_merge(goalBody(), ['wallet_id' => $walletId]));

    $data = $this->getJson("/api/wallets/{$walletId}/goal")->assertOk()->json('data');

    expect($data['balance'])->toBe(15_000_000)
        ->and($data['percent'])->toBe(100)      // cap 100 %, bukan 150
        ->and($data['remaining'])->toBe(0)      // max(10_000_000 - 15_000_000, 0) = 0
        ->and($data['achieved'])->toBeTrue();
});

it('menggunakan floor untuk persentase (bukan round atau ceil)', function () {
    $this->actingAs($this->u);
    $walletId = $this->savings->id;

    // 1 Rp dari target 3 Rp → floor(1*100/3) = 33
    $this->u->walletGoals()->create([
        'wallet_id'     => $walletId,
        'name'          => 'Test',
        'target_amount' => 3,
    ]);
    addIncome($this, 1, '2026-01-01');

    $data = $this->getJson("/api/wallets/{$walletId}/goal")->assertOk()->json('data');
    expect($data['percent'])->toBe(33);
});

// ─── Completed_at otomatis ─────────────────────────────────────────────────

it('menandai completed_at ketika target tercapai', function () {
    $this->actingAs($this->u);
    $walletId = $this->savings->id;

    $this->u->walletGoals()->create(array_merge(goalBody(), ['wallet_id' => $walletId]));

    // Belum tercapai
    $data = $this->getJson("/api/wallets/{$walletId}/goal")->assertOk()->json('data');
    expect($data['achieved'])->toBeFalse();
    expect($data['completed_at'])->toBeNull();

    // Tabung sampai target
    addIncome($this, 10_000_000);

    $data = $this->getJson("/api/wallets/{$walletId}/goal")->assertOk()->json('data');
    expect($data['achieved'])->toBeTrue();
    expect($data['completed_at'])->not->toBeNull();
});

it('menghapus completed_at ketika saldo turun di bawah target', function () {
    $this->actingAs($this->u);
    $walletId   = $this->savings->id;
    $categoryId = $this->cat->id;

    $this->u->walletGoals()->create(array_merge(goalBody(), [
        'wallet_id'    => $walletId,
        'completed_at' => now(),
    ]));

    // Saldo awal melebihi target
    addIncome($this, 10_000_000);

    // Tambah pengeluaran agar saldo turun
    $expCat = $this->u->categories()->create(['name' => 'Belanja', 'type' => 'expense']);
    $this->u->transactions()->create([
        'wallet_id'        => $walletId,
        'category_id'      => $expCat->id,
        'type'             => 'expense',
        'transaction_date' => '2026-02-01',
        'amount'           => 1_000_000,
    ]);

    $data = $this->getJson("/api/wallets/{$walletId}/goal")->assertOk()->json('data');
    expect($data['achieved'])->toBeFalse();
    expect($data['completed_at'])->toBeNull();
});

// ─── Deadline & estimasi setoran ──────────────────────────────────────────

it('mengembalikan deadline_info dengan estimasi setoran bila deadline belum lewat', function () {
    $this->travelTo(Carbon::parse('2026-01-01 08:00:00', 'Asia/Jakarta'));
    $this->actingAs($this->u);
    $walletId = $this->savings->id;

    // Deadline 14 hari ke depan (2 minggu), sisa 10 juta
    $this->u->walletGoals()->create([
        'wallet_id'     => $walletId,
        'name'          => 'Liburan',
        'target_amount' => 10_000_000,
        'deadline'      => '2026-01-15',
    ]);

    $info = $this->getJson("/api/wallets/{$walletId}/goal")->assertOk()->json('data.deadline_info');

    expect($info)->not->toBeNull()
        ->and($info['status'])->toBe('Dalam tenggat')
        ->and($info['weekly_deposit'])->not->toBeNull()
        ->and($info['deposit_note'])->toContain('Perkiraan setoran');
});

it('mengembalikan status tenggat terlewat tanpa estimasi bila deadline sudah lewat', function () {
    $this->travelTo(Carbon::parse('2026-02-01 08:00:00', 'Asia/Jakarta'));
    $this->actingAs($this->u);
    $walletId = $this->savings->id;

    $this->u->walletGoals()->create([
        'wallet_id'     => $walletId,
        'name'          => 'Liburan',
        'target_amount' => 10_000_000,
        'deadline'      => '2026-01-01', // sudah lewat
    ]);

    $info = $this->getJson("/api/wallets/{$walletId}/goal")->assertOk()->json('data.deadline_info');

    expect($info['status'])->toBe('Tenggat terlewat')
        ->and($info['weekly_deposit'])->toBeNull()
        ->and($info['deposit_note'])->toBeNull()
        ->and($info['days_left'])->toBeLessThan(0);
});

it('menghitung estimasi setoran dengan integer ceil tanpa float', function () {
    // Sisa 10 Rp dalam 3 minggu → ceil(10/3) = 4 (integer ceil)
    $this->travelTo(Carbon::parse('2026-01-01 08:00:00', 'Asia/Jakarta'));
    $this->actingAs($this->u);
    $walletId = $this->savings->id;

    $this->u->walletGoals()->create([
        'wallet_id'     => $walletId,
        'name'          => 'Test',
        'target_amount' => 10,
        'deadline'      => '2026-01-22', // 21 hari = 3 minggu tepat
    ]);

    $info = $this->getJson("/api/wallets/{$walletId}/goal")->assertOk()->json('data.deadline_info');

    // 3 minggu, sisa 10 → ceil(10/3) = 4
    expect($info['weekly_deposit'])->toBe(4);
});

it('menggunakan minimum 1 minggu bila tenggat kurang dari 7 hari', function () {
    $this->travelTo(Carbon::parse('2026-01-01 08:00:00', 'Asia/Jakarta'));
    $this->actingAs($this->u);
    $walletId = $this->savings->id;

    $this->u->walletGoals()->create([
        'wallet_id'     => $walletId,
        'name'          => 'Kilat',
        'target_amount' => 700_000,
        'deadline'      => '2026-01-04', // 3 hari lagi (< 7 hari) -> 1 minggu
    ]);

    $info = $this->getJson("/api/wallets/{$walletId}/goal")->assertOk()->json('data.deadline_info');

    expect($info['status'])->toBe('Dalam tenggat')
        ->and($info['days_left'])->toBe(3)
        ->and($info['weekly_deposit'])->toBe(700_000);
});

it('tidak memberi estimasi bila goal sudah tercapai walau ada deadline', function () {
    $this->travelTo(Carbon::parse('2026-01-01 08:00:00', 'Asia/Jakarta'));
    $this->actingAs($this->u);
    $walletId = $this->savings->id;

    addIncome($this, 20_000_000); // melampaui target

    $this->u->walletGoals()->create([
        'wallet_id'     => $walletId,
        'name'          => 'Test',
        'target_amount' => 10_000_000,
        'deadline'      => '2026-12-31',
    ]);

    $data = $this->getJson("/api/wallets/{$walletId}/goal")->assertOk()->json('data');
    expect($data['achieved'])->toBeTrue()
        ->and($data['deadline_info']['status'])->toBe('Tercapai')
        ->and($data['deadline_info']['weekly_deposit'])->toBeNull();
});

// ─── Validasi grup dompet ──────────────────────────────────────────────────

it('menolak pembuatan goal untuk dompet bukan Tabungan', function () {
    $this->actingAs($this->u);
    $walletId = $this->daily->id;

    $this->postJson("/api/wallets/{$walletId}/goal", goalBody())
        ->assertUnprocessable()
        ->assertJsonValidationErrors('wallet_id');
});

it('menolak dua goal untuk dompet yang sama', function () {
    $this->actingAs($this->u);
    $walletId = $this->savings->id;

    $this->postJson("/api/wallets/{$walletId}/goal", goalBody())->assertCreated();
    $this->postJson("/api/wallets/{$walletId}/goal", goalBody())
        ->assertUnprocessable()
        ->assertJsonValidationErrors('wallet_id');
});

// ─── Isolasi data antar pengguna ──────────────────────────────────────────

it('mengembalikan 404 untuk dompet atau goal milik pengguna lain', function () {
    $other        = User::factory()->create();
    $otherWallet  = $other->wallets()->create([
        'name'      => 'Lain',
        'type'      => 'bank',
        'group'     => 'savings',
        'icon_type' => 'preset',
        'icon_key'  => 'bank',
    ]);
    $other->walletGoals()->create(array_merge(goalBody(), ['wallet_id' => $otherWallet->id]));

    $this->actingAs($this->u);
    $this->getJson("/api/wallets/{$otherWallet->id}/goal")->assertNotFound();
    $this->postJson("/api/wallets/{$otherWallet->id}/goal", goalBody())->assertNotFound();
    $this->putJson("/api/wallets/{$otherWallet->id}/goal", goalBody())->assertNotFound();
    $this->deleteJson("/api/wallets/{$otherWallet->id}/goal")->assertNotFound();
});

// ─── Validasi field ────────────────────────────────────────────────────────

it('menolak target_amount nol atau negatif', function () {
    $this->actingAs($this->u);
    $walletId = $this->savings->id;

    $this->postJson("/api/wallets/{$walletId}/goal", goalBody(['target_amount' => 0]))
        ->assertUnprocessable()->assertJsonValidationErrors('target_amount');

    $this->postJson("/api/wallets/{$walletId}/goal", goalBody(['target_amount' => -100]))
        ->assertUnprocessable()->assertJsonValidationErrors('target_amount');
});

it('menolak deadline yang sudah lewat saat membuat atau mengubah goal', function () {
    $this->actingAs($this->u);
    $walletId = $this->savings->id;

    $this->postJson("/api/wallets/{$walletId}/goal", goalBody(['deadline' => '2020-01-01']))
        ->assertUnprocessable()->assertJsonValidationErrors('deadline');

    $this->u->walletGoals()->create(array_merge(goalBody(), ['wallet_id' => $walletId]));

    $this->putJson("/api/wallets/{$walletId}/goal", ['deadline' => '2020-01-01'])
        ->assertUnprocessable()->assertJsonValidationErrors('deadline');
});

it('memerlukan login untuk API goal', function () {
    $walletId = $this->savings->id;

    $this->getJson("/api/wallets/{$walletId}/goal")->assertUnauthorized();
    $this->postJson("/api/wallets/{$walletId}/goal", goalBody())->assertUnauthorized();
    $this->putJson("/api/wallets/{$walletId}/goal", goalBody())->assertUnauthorized();
    $this->deleteJson("/api/wallets/{$walletId}/goal")->assertUnauthorized();
});
