<?php

namespace App\Services;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function __construct(private BalanceService $balances) {}

    public function forMonth(User $user, string $month): array
    {
        $start = Carbon::createFromFormat('Y-m-d', $month.'-01', 'Asia/Jakarta')->startOfMonth();
        $range = [$start->toDateString(), $start->copy()->endOfMonth()->toDateString()];

        $wallets = $user->wallets()->where('is_active', true)->orderBy('id')->get();
        $map = $this->balances->forWallets($wallets);

        $totals = DB::table('transactions')
            ->where('user_id', $user->id)->whereNull('deleted_at')
            ->whereBetween('transaction_date', $range)
            ->selectRaw("COALESCE(SUM(CASE WHEN type='income' THEN amount END),0) AS income,
                         COALESCE(SUM(CASE WHEN type='expense' THEN amount END),0) AS expense")
            ->first();

        $byCategory = DB::table('transactions')
            ->join('categories', function ($j) {
                $j->on('categories.id', '=', 'transactions.category_id')
                    ->on('categories.user_id', '=', 'transactions.user_id');
            })
            ->where('transactions.user_id', $user->id)
            ->where('transactions.type', 'expense')
            ->whereNull('transactions.deleted_at')
            ->whereBetween('transactions.transaction_date', $range)
            ->groupBy('categories.id', 'categories.name', 'categories.icon_key')
            ->orderByDesc(DB::raw('SUM(transactions.amount)'))
            ->selectRaw('categories.id, categories.name, categories.icon_key, SUM(transactions.amount) AS amount')
            ->get()
            ->map(fn ($r) => [
                'category_id' => (int) $r->id, 'name' => $r->name,
                'icon_key' => $r->icon_key, 'amount' => (int) $r->amount,
            ])->all();

        $recent = $user->transactions()
            ->with(['wallet:id,name', 'category:id,name,icon_key'])
            ->orderByDesc('transaction_date')->orderByDesc('id')->limit(5)->get()
            ->map(fn ($t) => [
                'id' => $t->id, 'type' => $t->type, 'amount' => $t->amount,
                'transaction_date' => $t->transaction_date->format('Y-m-d'),
                'notes' => $t->notes,
                'wallet' => ['id' => $t->wallet->id, 'name' => $t->wallet->name],
                'category' => ['id' => $t->category->id, 'name' => $t->category->name, 'icon_key' => $t->category->icon_key],
            ])->all();

        return [
            'month' => $month,
            'total_balance' => array_sum($map),
            'income' => (int) $totals->income,
            'expense' => (int) $totals->expense,
            'wallets' => $wallets->map(fn ($w) => [
                'id' => $w->id, 'name' => $w->name, 'type' => $w->type,
                'icon_key' => $w->icon_key, 'balance' => $map[$w->id],
            ])->all(),
            'expense_by_category' => $byCategory,
            'recent_transactions' => $recent,
        ];
    }
}
