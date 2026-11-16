<?php

namespace App\Services;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class BalanceService
{
    /** Saldo = awal + pemasukan - pengeluaran + transfer masuk - transfer keluar (data aktif saja). */
    public function forWallet(Wallet $wallet): int
    {
        return $this->forWallets(collect([$wallet]))[$wallet->id];
    }

    /**
     * @param  Collection<int, Wallet>  $wallets
     * @return array<int, int> wallet_id => saldo
     */
    public function forWallets(Collection $wallets): array
    {
        $ids = $wallets->pluck('id')->all();
        if ($ids === []) {
            return [];
        }

        $tx = DB::table('transactions')
            ->whereIn('wallet_id', $ids)->whereNull('deleted_at')
            ->selectRaw("wallet_id, SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) AS net")
            ->groupBy('wallet_id')->pluck('net', 'wallet_id');

        $in = DB::table('transfers')
            ->whereIn('destination_wallet_id', $ids)->whereNull('deleted_at')
            ->selectRaw('destination_wallet_id AS wid, SUM(amount) AS total')
            ->groupBy('destination_wallet_id')->pluck('total', 'wid');

        $out = DB::table('transfers')
            ->whereIn('source_wallet_id', $ids)->whereNull('deleted_at')
            ->selectRaw('source_wallet_id AS wid, SUM(amount) AS total')
            ->groupBy('source_wallet_id')->pluck('total', 'wid');

        $result = [];
        foreach ($wallets as $w) {
            $result[$w->id] = (int) $w->opening_balance
                + (int) ($tx[$w->id] ?? 0)
                + (int) ($in[$w->id] ?? 0)
                - (int) ($out[$w->id] ?? 0);
        }

        return $result;
    }

    public function totalForUser(User $user): int
    {
        return array_sum($this->forWallets($user->wallets()->get()));
    }
}
