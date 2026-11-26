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
        $end = $start->copy()->endOfMonth();
        $range = [$start->toDateString(), $end->toDateString()];

        $wallets = $user->wallets()->where('is_active', true)->orderBy('id')->get();
        $map = $this->balances->forWallets($wallets);

        $totals = DB::table('transactions')
            ->where('user_id', $user->id)->whereNull('deleted_at')
            ->whereBetween('transaction_date', $range)
            ->selectRaw("COALESCE(SUM(CASE WHEN type='income' THEN amount END),0) AS income,
                         COALESCE(SUM(CASE WHEN type='expense' THEN amount END),0) AS expense")
            ->first();

        $daily = DB::table('transactions')
            ->where('user_id', $user->id)->whereNull('deleted_at')
            ->whereBetween('transaction_date', $range)
            ->groupBy('transaction_date')
            ->selectRaw("transaction_date,
                         COALESCE(SUM(CASE WHEN type='income' THEN amount END),0) AS income,
                         COALESCE(SUM(CASE WHEN type='expense' THEN amount END),0) AS expense")
            ->get()
            ->keyBy(fn ($row) => Carbon::parse($row->transaction_date, 'Asia/Jakarta')->toDateString());

        // Zero-fill every day of the requested month so charts and weekly grouping
        // can render continuous data without the frontend inventing missing dates.
        $dailyCashFlow = [];
        for ($day = $start->copy(); $day->lte($end); $day->addDay()) {
            $date = $day->toDateString();
            $row = $daily->get($date);

            $dailyCashFlow[] = [
                'date' => $date,
                'income' => (int) ($row->income ?? 0),
                'expense' => (int) ($row->expense ?? 0),
            ];
        }

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
                'group' => $w->group, 'card_theme' => $w->card_theme ?? 'default',
                'icon_type' => $w->icon_type, 'icon_key' => $w->icon_key,
                'has_card_image' => (bool) $w->card_image_path,
                'balance' => $map[$w->id],
            ])->all(),
            'daily_cash_flow' => $dailyCashFlow,
            'income_by_category' => $this->byCategory($user, 'income', $range),
            'expense_by_category' => $this->byCategory($user, 'expense', $range),
            'recent_transactions' => $recent,
        ];
    }

    /**
     * Aggregate active transactions of one type per category for the given range.
     *
     * @param  array{0: string, 1: string}  $range
     * @return array<int, array{category_id: int, name: string, icon_key: string|null, amount: int}>
     */
    private function byCategory(User $user, string $type, array $range): array
    {
        return DB::table('transactions')
            ->join('categories', function ($j) {
                $j->on('categories.id', '=', 'transactions.category_id')
                    ->on('categories.user_id', '=', 'transactions.user_id');
            })
            ->where('transactions.user_id', $user->id)
            ->where('transactions.type', $type)
            ->whereNull('transactions.deleted_at')
            ->whereBetween('transactions.transaction_date', $range)
            ->groupBy('categories.id', 'categories.name', 'categories.icon_key')
            ->orderByDesc(DB::raw('SUM(transactions.amount)'))
            ->orderBy('categories.id')
            ->selectRaw('categories.id, categories.name, categories.icon_key, SUM(transactions.amount) AS amount')
            ->get()
            ->map(fn ($r) => [
                'category_id' => (int) $r->id, 'name' => $r->name,
                'icon_key' => $r->icon_key, 'amount' => (int) $r->amount,
            ])->all();
    }
}
