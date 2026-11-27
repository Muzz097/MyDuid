<?php

namespace App\Services;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportService
{
    private const WEEKDAY_KEYS = [
        1 => 'monday',
        2 => 'tuesday',
        3 => 'wednesday',
        4 => 'thursday',
        5 => 'friday',
        6 => 'saturday',
        7 => 'sunday',
    ];

    public function __construct(private BalanceService $balances) {}

    public function summary(User $user, Carbon $from, Carbon $to): array
    {
        $current = $this->periodTotals($user, $from, $to);
        $comp = ComparisonPeriod::resolve($from, $to);
        $previous = $this->periodTotals($user, $comp['from'], $comp['to']);

        $income = $current['income'];
        $expense = $current['expense'];
        $net = $income - $expense;
        $prevNet = $previous['income'] - $previous['expense'];

        $incomeUsedPercent = $income > 0 ? intdiv($expense * 100, $income) : null;

        return [
            'income' => $income,
            'expense' => $expense,
            'net' => $net,
            'transaction_count' => $current['transaction_count'],
            'has_data' => $current['transaction_count'] > 0,
            'income_used_percent' => $incomeUsedPercent,
            'income_remaining_percent' => $incomeUsedPercent !== null ? 100 - $incomeUsedPercent : null,
            'cash_flow' => $net > 0 ? 'positive' : ($net < 0 ? 'negative' : 'zero'),
            'previous' => [
                'from' => $comp['from']->toDateString(),
                'to' => $comp['to']->toDateString(),
                'income' => $previous['income'],
                'expense' => $previous['expense'],
                'net' => $prevNet,
                'income_change_percent' => $this->percentChange($income, $previous['income']),
                'expense_change_percent' => $this->percentChange($expense, $previous['expense']),
                'net_change_percent' => $this->percentChange($net, $prevNet),
            ],
            'comparison_basis' => $comp['basis'],
        ];
    }

    public function cashflow(User $user, Carbon $from, Carbon $to, ?string $granularity = null): array
    {
        $resolvedGranularity = $granularity ?? ($from->diffInDays($to) <= 31 ? 'day' : 'week');

        $daily = DB::table('transactions')
            ->where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->whereBetween('transaction_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('transaction_date')
            ->selectRaw("transaction_date,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense")
            ->get()
            ->mapWithKeys(fn ($row) => [
                Carbon::parse($row->transaction_date, 'Asia/Jakarta')->toDateString() => [
                    'income' => (int) $row->income,
                    'expense' => (int) $row->expense,
                ],
            ]);

        $buckets = [];
        $cursor = $from->copy();

        while ($cursor->lte($to)) {
            if ($resolvedGranularity === 'day') {
                $bucketEnd = $cursor->copy();
            } elseif ($resolvedGranularity === 'week') {
                $bucketEnd = $cursor->copy()->endOfWeek(Carbon::SUNDAY);
                if ($bucketEnd->gt($to)) {
                    $bucketEnd = $to->copy();
                }
            } else {
                $bucketEnd = $cursor->copy()->endOfMonth();
                if ($bucketEnd->gt($to)) {
                    $bucketEnd = $to->copy();
                }
            }

            $income = 0;
            $expense = 0;
            for ($d = $cursor->copy(); $d->lte($bucketEnd); $d->addDay()) {
                $entry = $daily->get($d->toDateString());
                if ($entry !== null) {
                    $income += $entry['income'];
                    $expense += $entry['expense'];
                }
            }

            $buckets[] = [
                'from' => $cursor->toDateString(),
                'to' => $bucketEnd->toDateString(),
                'income' => $income,
                'expense' => $expense,
            ];

            $cursor = $bucketEnd->copy()->addDay();
        }

        return $buckets;
    }

    public function categories(User $user, Carbon $from, Carbon $to, string $type = 'expense'): array
    {
        $current = $this->categoryTotals($user, $from, $to, $type);
        $comp = ComparisonPeriod::resolve($from, $to);
        $previous = $this->categoryTotals($user, $comp['from'], $comp['to'], $type)
            ->keyBy('category_id');

        $totalAmount = (int) $current->sum('amount');

        $items = $current->map(function ($row) use ($previous, $totalAmount) {
            $prevRow = $previous->get($row['category_id']);
            $prevAmount = $prevRow['amount'] ?? 0;

            return [
                'category_id' => $row['category_id'],
                'name' => $row['name'],
                'icon_key' => $row['icon_key'],
                'amount' => $row['amount'],
                'count' => $row['count'],
                'average' => $row['count'] > 0 ? intdiv($row['amount'], $row['count']) : 0,
                'share_percent' => $totalAmount > 0 ? intdiv($row['amount'] * 100, $totalAmount) : 0,
                'change_percent' => $this->percentChange($row['amount'], $prevAmount),
            ];
        })->values();

        $byAmount = $items->sort(function ($a, $b) {
            return [$b['amount'], $a['category_id']] <=> [$a['amount'], $b['category_id']];
        })->values()->all();

        $byCount = $items->sort(function ($a, $b) {
            return [$b['count'], $b['amount'], $a['category_id']] <=> [$a['count'], $a['amount'], $b['category_id']];
        })->values()->all();

        return [
            'by_amount' => $byAmount,
            'by_count' => $byCount,
        ];
    }

    public function trends(User $user, int $months = 6): array
    {
        $now = Carbon::now('Asia/Jakarta')->startOfDay();
        $currentMonthStart = $now->copy()->startOfMonth();
        $rangeStart = $currentMonthStart->copy()->subMonthsNoOverflow($months - 1);
        $rangeEnd = $now->copy()->endOfMonth();

        $rows = DB::table('transactions')
            ->where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->whereBetween('transaction_date', [$rangeStart->toDateString(), $rangeEnd->toDateString()])
            ->select('transaction_date', 'type', 'amount')
            ->get();

        $monthlyMap = [];
        for ($i = 0; $i < $months; $i++) {
            $m = $rangeStart->copy()->addMonthsNoOverflow($i);
            $key = $m->format('Y-m');
            $monthlyMap[$key] = [
                'month' => $key,
                'income' => 0,
                'expense' => 0,
                'is_partial' => $m->isSameMonth($currentMonthStart),
            ];
        }

        $weekdayTotals = array_fill(1, 7, ['total' => 0, 'count' => 0]);

        foreach ($rows as $row) {
            $date = Carbon::parse($row->transaction_date, 'Asia/Jakarta');
            $monthKey = $date->format('Y-m');
            $amount = (int) $row->amount;

            if (isset($monthlyMap[$monthKey])) {
                if ($row->type === 'income') {
                    $monthlyMap[$monthKey]['income'] += $amount;
                } elseif ($row->type === 'expense') {
                    $monthlyMap[$monthKey]['expense'] += $amount;
                }
            }

            if ($row->type === 'expense') {
                $isoDay = $date->isoWeekday();
                $weekdayTotals[$isoDay]['total'] += $amount;
                $weekdayTotals[$isoDay]['count'] += 1;
            }
        }

        $monthly = array_values($monthlyMap);
        $fullWithExpense = array_values(array_filter(
            $monthly,
            fn (array $m) => ! $m['is_partial'] && $m['expense'] > 0
        ));

        $averageExpense = count($fullWithExpense) > 0
            ? intdiv(array_sum(array_column($fullWithExpense, 'expense')), count($fullWithExpense))
            : null;

        $highestMonth = null;
        $lowestMonth = null;
        foreach ($fullWithExpense as $m) {
            if ($highestMonth === null || $m['expense'] > $highestMonth['expense']) {
                $highestMonth = ['month' => $m['month'], 'expense' => $m['expense']];
            }
            if ($lowestMonth === null || $m['expense'] < $lowestMonth['expense']) {
                $lowestMonth = ['month' => $m['month'], 'expense' => $m['expense']];
            }
        }

        $fullMonths = array_values(array_filter($monthly, fn (array $m) => ! $m['is_partial']));
        $momChange = null;
        if (count($fullMonths) >= 2) {
            $latest = $fullMonths[count($fullMonths) - 1];
            $prev = $fullMonths[count($fullMonths) - 2];
            $momChange = $this->percentChange($latest['expense'], $prev['expense']);
        }

        $weekdayOccurrences = array_fill(1, 7, 0);
        for ($d = $rangeStart->copy(); $d->lte($now); $d->addDay()) {
            $weekdayOccurrences[$d->isoWeekday()] += 1;
        }

        $weekdayRhythm = [];
        foreach (self::WEEKDAY_KEYS as $isoDay => $key) {
            $occ = $weekdayOccurrences[$isoDay];
            $total = $weekdayTotals[$isoDay]['total'];
            $weekdayRhythm[] = [
                'iso_weekday' => $isoDay,
                'key' => $key,
                'total' => $total,
                'count' => $weekdayTotals[$isoDay]['count'],
                'average_per_occurrence' => $occ > 0 ? intdiv($total, $occ) : 0,
            ];
        }

        return [
            'monthly' => $monthly,
            'average_expense' => $averageExpense,
            'highest_expense_month' => $highestMonth,
            'lowest_expense_month' => $lowestMonth,
            'month_over_month_change_percent' => $momChange,
            'weekday_rhythm' => $weekdayRhythm,
        ];
    }

    public function wallets(User $user, Carbon $from, Carbon $to): array
    {
        $wallets = $user->wallets()->orderBy('id')->get();
        $balanceMap = $this->balances->forWallets($wallets);
        $range = [$from->toDateString(), $to->toDateString()];

        $txByWallet = DB::table('transactions')
            ->where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->whereBetween('transaction_date', $range)
            ->groupBy('wallet_id')
            ->selectRaw("wallet_id,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
                COUNT(*) AS tx_count")
            ->get()
            ->keyBy('wallet_id');

        $transferIn = DB::table('transfers')
            ->where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->whereBetween('transfer_date', $range)
            ->groupBy('destination_wallet_id')
            ->selectRaw('destination_wallet_id AS wallet_id, COALESCE(SUM(amount), 0) AS total')
            ->pluck('total', 'wallet_id');

        $transferOut = DB::table('transfers')
            ->where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->whereBetween('transfer_date', $range)
            ->groupBy('source_wallet_id')
            ->selectRaw('source_wallet_id AS wallet_id, COALESCE(SUM(amount), 0) AS total')
            ->pluck('total', 'wallet_id');

        $result = [];
        foreach ($wallets as $w) {
            $tx = $txByWallet->get($w->id);
            $income = (int) ($tx->income ?? 0);
            $expense = (int) ($tx->expense ?? 0);
            $txCount = (int) ($tx->tx_count ?? 0);
            $in = (int) ($transferIn[$w->id] ?? 0);
            $out = (int) ($transferOut[$w->id] ?? 0);

            $hasActivity = $txCount > 0 || $in > 0 || $out > 0;
            if (! $w->is_active && ! $hasActivity) {
                continue;
            }

            $result[] = [
                'wallet_id' => $w->id,
                'name' => $w->name,
                'icon_key' => $w->icon_key,
                'is_active' => (bool) $w->is_active,
                'income' => $income,
                'expense' => $expense,
                'transfer_in' => $in,
                'transfer_out' => $out,
                'transaction_count' => $txCount,
                'balance' => $balanceMap[$w->id] ?? 0,
            ];
        }

        return $result;
    }

    public function comparison(User $user, Carbon $from, Carbon $to): array
    {
        $summary = $this->summary($user, $from, $to);
        $comp = ComparisonPeriod::resolve($from, $to);

        $currentCats = $this->categoryTotals($user, $from, $to, 'expense')->keyBy('category_id');
        $prevCats = $this->categoryTotals($user, $comp['from'], $comp['to'], 'expense')->keyBy('category_id');

        $allIds = $currentCats->keys()->merge($prevCats->keys())->unique();
        $contributors = [];

        foreach ($allIds as $cid) {
            $curr = $currentCats->get($cid);
            $prev = $prevCats->get($cid);
            $currAmount = $curr['amount'] ?? 0;
            $prevAmount = $prev['amount'] ?? 0;
            $delta = $currAmount - $prevAmount;

            if ($delta === 0) {
                continue;
            }

            $contributors[] = [
                'category_id' => (int) $cid,
                'name' => $curr['name'] ?? $prev['name'],
                'current' => $currAmount,
                'previous' => $prevAmount,
                'delta' => $delta,
                'direction' => $delta > 0 ? 'up' : 'down',
            ];
        }

        usort($contributors, fn ($a, $b) => [abs($b['delta']), $a['category_id']] <=> [abs($a['delta']), $b['category_id']]);

        return [
            'period' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'income' => $summary['income'],
                'expense' => $summary['expense'],
                'net' => $summary['net'],
            ],
            'comparison' => [
                'from' => $summary['previous']['from'],
                'to' => $summary['previous']['to'],
                'basis' => $summary['comparison_basis'],
                'income' => $summary['previous']['income'],
                'expense' => $summary['previous']['expense'],
                'net' => $summary['previous']['net'],
            ],
            'income_change_percent' => $summary['previous']['income_change_percent'],
            'expense_change_percent' => $summary['previous']['expense_change_percent'],
            'net_change_percent' => $summary['previous']['net_change_percent'],
            'contributors' => array_slice($contributors, 0, 5),
        ];
    }

    public function story(User $user, Carbon $from, Carbon $to): array
    {
        $range = [$from->toDateString(), $to->toDateString()];
        $reasons = [];

        $topCategory = DB::table('transactions')
            ->join('categories', function ($j) {
                $j->on('categories.id', '=', 'transactions.category_id')
                    ->on('categories.user_id', '=', 'transactions.user_id');
            })
            ->where('transactions.user_id', $user->id)
            ->where('transactions.type', 'expense')
            ->whereNull('transactions.deleted_at')
            ->whereBetween('transactions.transaction_date', $range)
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc(DB::raw('SUM(transactions.amount)'))
            ->orderBy('categories.id')
            ->selectRaw('categories.id AS category_id, categories.name, SUM(transactions.amount) AS amount')
            ->first();

        $busiestDay = DB::table('transactions')
            ->where('user_id', $user->id)
            ->where('type', 'expense')
            ->whereNull('deleted_at')
            ->whereBetween('transaction_date', $range)
            ->groupBy('transaction_date')
            ->orderByDesc(DB::raw('SUM(amount)'))
            ->orderBy('transaction_date')
            ->selectRaw('transaction_date, SUM(amount) AS amount')
            ->first();

        $largestExpenseRow = DB::table('transactions')
            ->leftJoin('categories', 'categories.id', '=', 'transactions.category_id')
            ->where('transactions.user_id', $user->id)
            ->where('transactions.type', 'expense')
            ->whereNull('transactions.deleted_at')
            ->whereBetween('transactions.transaction_date', $range)
            ->orderByDesc('transactions.amount')
            ->orderByDesc('transactions.transaction_date')
            ->orderByDesc('transactions.id')
            ->select(
                'transactions.id',
                'transactions.amount',
                'transactions.notes',
                'transactions.transaction_date',
                'transactions.category_id',
                'categories.name AS category_name'
            )
            ->first();

        $currentTotals = $this->periodTotals($user, $from, $to);
        $comp = ComparisonPeriod::resolve($from, $to);
        $prevTotals = $this->periodTotals($user, $comp['from'], $comp['to']);

        if (! $topCategory) {
            $reasons['top_expense_category'] = 'no_expense_in_period';
        }
        if (! $busiestDay) {
            $reasons['busiest_day'] = 'no_expense_in_period';
        }
        if (! $largestExpenseRow) {
            $reasons['largest_expense'] = 'no_expense_in_period';
        }

        $expenseChange = null;
        if ($prevTotals['expense'] === 0) {
            $reasons['expense_change'] = 'no_previous_expense';
        } else {
            $expenseChange = [
                'percent' => $this->percentChange($currentTotals['expense'], $prevTotals['expense']),
                'previous_amount' => $prevTotals['expense'],
            ];
        }

        return [
            'top_expense_category' => $topCategory ? [
                'category_id' => (int) $topCategory->category_id,
                'name' => $topCategory->name,
                'amount' => (int) $topCategory->amount,
            ] : null,
            'busiest_day' => $busiestDay ? [
                'date' => Carbon::parse($busiestDay->transaction_date, 'Asia/Jakarta')->toDateString(),
                'amount' => (int) $busiestDay->amount,
            ] : null,
            'largest_expense' => $largestExpenseRow ? [
                'id' => (int) $largestExpenseRow->id,
                'amount' => (int) $largestExpenseRow->amount,
                'notes' => $largestExpenseRow->notes,
                'transaction_date' => Carbon::parse($largestExpenseRow->transaction_date, 'Asia/Jakarta')->toDateString(),
                'category_id' => $largestExpenseRow->category_id ? (int) $largestExpenseRow->category_id : null,
                'category_name' => $largestExpenseRow->category_name,
            ] : null,
            'expense_change' => $expenseChange,
            'reasons' => $reasons,
        ];
    }

    /**
     * @return array{income: int, expense: int, transaction_count: int}
     */
    private function periodTotals(User $user, Carbon $from, Carbon $to): array
    {
        $row = DB::table('transactions')
            ->where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->whereBetween('transaction_date', [$from->toDateString(), $to->toDateString()])
            ->selectRaw("COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
                COUNT(*) AS tx_count")
            ->first();

        return [
            'income' => (int) ($row->income ?? 0),
            'expense' => (int) ($row->expense ?? 0),
            'transaction_count' => (int) ($row->tx_count ?? 0),
        ];
    }

    private function categoryTotals(User $user, Carbon $from, Carbon $to, string $type)
    {
        return DB::table('transactions')
            ->join('categories', function ($j) {
                $j->on('categories.id', '=', 'transactions.category_id')
                    ->on('categories.user_id', '=', 'transactions.user_id');
            })
            ->where('transactions.user_id', $user->id)
            ->where('transactions.type', $type)
            ->whereNull('transactions.deleted_at')
            ->whereBetween('transactions.transaction_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('categories.id', 'categories.name', 'categories.icon_key')
            ->selectRaw('categories.id AS category_id, categories.name, categories.icon_key, SUM(transactions.amount) AS amount, COUNT(*) AS tx_count')
            ->get()
            ->map(fn ($r) => [
                'category_id' => (int) $r->category_id,
                'name' => $r->name,
                'icon_key' => $r->icon_key,
                'amount' => (int) $r->amount,
                'count' => (int) $r->tx_count,
            ]);
    }

    private function percentChange(int $current, int $previous): ?int
    {
        if ($previous === 0) {
            return null;
        }

        return intdiv(($current - $previous) * 100, abs($previous));
    }
}
