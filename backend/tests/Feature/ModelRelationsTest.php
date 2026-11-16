<?php

use App\Models\Budget;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\Transfer;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('mengisi user_id saat dompet dibuat lewat relasi user', function () {
    $user = User::factory()->create();

    $wallet = $user->wallets()->create([
        'name' => 'Dompet Harian',
        'type' => 'cash',
        'icon_type' => 'preset',
        'icon_key' => 'wallet',
    ]);

    expect($wallet->user_id)->toBe($user->id)
        ->and($wallet->user->is($user))->toBeTrue()
        ->and($wallet->icon_type)->toBe('preset')
        ->and($wallet->icon_key)->toBe('wallet')
        ->and($user->wallets()->count())->toBe(1);
});

it('menyediakan relasi HasMany dari user ke seluruh data keuangan', function () {
    $user = User::factory()->create();
    $wallet = $user->wallets()->create(['name' => 'Tabungan', 'type' => 'bank', 'icon_key' => 'landmark']);
    $otherWallet = Wallet::factory()->for($user)->create();
    $category = $user->categories()->create(['name' => 'Makan', 'type' => 'expense']);

    $user->transactions()->create([
        'wallet_id' => $wallet->id,
        'category_id' => $category->id,
        'transaction_date' => '2026-11-01',
        'amount' => 25_000,
        'type' => 'expense',
    ]);

    $user->transfers()->create([
        'source_wallet_id' => $wallet->id,
        'destination_wallet_id' => $otherWallet->id,
        'transfer_date' => '2026-11-02',
        'amount' => 50_000,
    ]);

    $user->budgets()->create([
        'category_id' => $category->id,
        'year' => 2026,
        'month' => 11,
        'limit_amount' => 1_000_000,
    ]);

    expect($user->wallets()->count())->toBe(2)
        ->and($user->categories()->count())->toBe(1)
        ->and($user->transactions()->count())->toBe(1)
        ->and($user->transfers()->count())->toBe(1)
        ->and($user->budgets()->count())->toBe(1)
        ->and($wallet->transactions()->count())->toBe(1)
        ->and($category->transactions()->count())->toBe(1);
});

it('menghubungkan transaksi dengan user, dompet, dan kategori', function () {
    $user = User::factory()->create();
    $wallet = Wallet::factory()->for($user)->create();
    $category = Category::factory()->for($user)->create(['type' => 'income']);

    $transaction = Transaction::factory()->create([
        'user_id' => $user->id,
        'wallet_id' => $wallet->id,
        'category_id' => $category->id,
    ]);

    expect($transaction->user->is($user))->toBeTrue()
        ->and($transaction->wallet->is($wallet))->toBeTrue()
        ->and($transaction->category->is($category))->toBeTrue()
        ->and($transaction->type)->toBe('income')
        ->and($transaction->amount)->toBeInt()
        ->and($transaction->transaction_date->format('Y-m-d'))->toBe($transaction->getRawOriginal('transaction_date'));
});

it('menghubungkan transfer dengan dompet asal dan tujuan', function () {
    $user = User::factory()->create();
    $source = Wallet::factory()->for($user)->create();
    $destination = Wallet::factory()->for($user)->create();

    $transfer = Transfer::factory()->create([
        'user_id' => $user->id,
        'source_wallet_id' => $source->id,
        'destination_wallet_id' => $destination->id,
    ]);

    expect($transfer->user->is($user))->toBeTrue()
        ->and($transfer->sourceWallet->is($source))->toBeTrue()
        ->and($transfer->destinationWallet->is($destination))->toBeTrue()
        ->and($transfer->amount)->toBeInt()
        ->and($transfer->transfer_date)->not->toBeNull();
});

it('menghubungkan anggaran dengan kategori atau dompet', function () {
    $user = User::factory()->create();
    $wallet = Wallet::factory()->for($user)->create();
    $category = Category::factory()->for($user)->create(['type' => 'expense']);

    $categoryBudget = Budget::factory()->create([
        'user_id' => $user->id,
        'category_id' => $category->id,
    ]);

    $walletBudget = Budget::factory()->create([
        'user_id' => $user->id,
        'wallet_id' => $wallet->id,
    ]);

    expect($categoryBudget->user->is($user))->toBeTrue()
        ->and($categoryBudget->category->is($category))->toBeTrue()
        ->and($categoryBudget->wallet)->toBeNull()
        ->and($walletBudget->wallet->is($wallet))->toBeTrue()
        ->and($walletBudget->category)->toBeNull()
        ->and($categoryBudget->year)->toBeInt()
        ->and($categoryBudget->month)->toBeInt()
        ->and($categoryBudget->limit_amount)->toBeInt();
});

it('menyembunyikan transaksi dan transfer yang sudah dihapus', function () {
    $user = User::factory()->create();
    $wallet = Wallet::factory()->for($user)->create();
    $otherWallet = Wallet::factory()->for($user)->create();
    $category = Category::factory()->for($user)->create();

    $transaction = Transaction::factory()->create([
        'user_id' => $user->id,
        'wallet_id' => $wallet->id,
        'category_id' => $category->id,
    ]);

    $transfer = Transfer::factory()->create([
        'user_id' => $user->id,
        'source_wallet_id' => $wallet->id,
        'destination_wallet_id' => $otherWallet->id,
    ]);

    $transaction->delete();
    $transfer->delete();

    expect(Transaction::count())->toBe(0)
        ->and(Transfer::count())->toBe(0)
        ->and(Transaction::withTrashed()->count())->toBe(1)
        ->and(Transfer::withTrashed()->count())->toBe(1)
        ->and($wallet->transactions()->count())->toBe(0);
});
