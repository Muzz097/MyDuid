<?php

namespace App\Services;

use App\Models\Budget;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class WrappedService
{
    public const MIN_TRANSACTIONS_FOR_PERSONA = 10;

    public const MOMENT_HUNTER_MIN_SPEND_DAYS = 3;

    public const MOMENT_HUNTER_DAY_SHARE_PERCENT = 35;

    public const WEEKEND_KING_SHARE_PERCENT = 40;

    public const ROUTINE_MIN_TRANSACTIONS = 30;

    public const ROUTINE_MIN_ACTIVE_DAYS = 20;

    private const WEEKDAY_KEYS = [
        1 => 'monday',
        2 => 'tuesday',
        3 => 'wednesday',
        4 => 'thursday',
        5 => 'friday',
        6 => 'saturday',
        7 => 'sunday',
    ];

    public function __construct(
        private ReportService $reports,
        private BudgetProgressService $budgetProgress,
    ) {}

    public function months(User $user): array
    {
        $currentMonthStart = Carbon::now('Asia/Jakarta')->startOfMonth();

        $rows = DB::table('transactions')
            ->where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->where('transaction_date', '<', $currentMonthStart->toDateString())
            ->selectRaw('SUBSTR(CAST(transaction_date AS VARCHAR(10)), 1, 7) AS ym, COUNT(*) AS tx_count')
            ->groupBy('ym')
            ->orderByDesc('ym')
            ->limit(12)
            ->get();

        $months = $rows->map(fn ($row) => [
            'month' => (string) $row->ym,
            'transaction_count' => (int) $row->tx_count,
        ])->values()->all();

        return [
            'months' => $months,
            'upcoming' => [
                'month' => $currentMonthStart->format('Y-m'),
                'available_at' => $currentMonthStart->copy()->addMonthNoOverflow()->toDateString(),
            ],
        ];
    }

    public function show(User $user, Carbon $monthStart): array
    {
        $from = $monthStart->copy()->timezone('Asia/Jakarta')->startOfMonth();
        $to = $from->copy()->endOfMonth();

        $summaryData = $this->reports->summary($user, $from, $to);
        $hasData = $summaryData['has_data'];
        $transactionCount = $summaryData['transaction_count'];

        $dailyRows = DB::table('transactions')
            ->where('user_id', $user->id)
            ->whereNull('deleted_at')
            ->whereBetween('transaction_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('transaction_date')
            ->selectRaw("transaction_date,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
                COUNT(*) AS tx_count")
            ->get()
            ->keyBy(fn ($r) => Carbon::parse($r->transaction_date, 'Asia/Jakarta')->toDateString());

        $dailyExpense = [];
        $spendDays = [];
        $noSpendDays = 0;
        $currentNoSpendStreak = 0;
        $longestNoSpendStreak = 0;
        $daysWithRecords = 0;
        $currentLoggingStreak = 0;
        $longestLoggingStreak = 0;

        for ($d = $from->copy(); $d->lte($to); $d->addDay()) {
            $dateStr = $d->toDateString();
            $row = $dailyRows->get($dateStr);
            $expenseAmount = (int) ($row->expense ?? 0);
            $txCount = (int) ($row->tx_count ?? 0);

            $dailyExpense[] = [
                'date' => $dateStr,
                'amount' => $expenseAmount,
            ];

            if ($expenseAmount > 0) {
                $spendDays[] = ['date' => $dateStr, 'amount' => $expenseAmount];
                $currentNoSpendStreak = 0;
            } else {
                $noSpendDays++;
                $currentNoSpendStreak++;
                if ($currentNoSpendStreak > $longestNoSpendStreak) {
                    $longestNoSpendStreak = $currentNoSpendStreak;
                }
            }

            if ($txCount > 0) {
                $daysWithRecords++;
                $currentLoggingStreak++;
                if ($currentLoggingStreak > $longestLoggingStreak) {
                    $longestLoggingStreak = $currentLoggingStreak;
                }
            } else {
                $currentLoggingStreak = 0;
            }
        }

        $biggestDay = null;
        $frugalDay = null;
        $spendDayCount = count($spendDays);

        if ($spendDayCount > 0) {
            $sortedDesc = $spendDays;
            usort($sortedDesc, fn ($a, $b) => [$b['amount'], $a['date']] <=> [$a['amount'], $b['date']]);
            $biggestDay = $sortedDesc[0];

            if ($spendDayCount >= 3) {
                $sortedAsc = $spendDays;
                usort($sortedAsc, fn ($a, $b) => [$a['amount'], $a['date']] <=> [$b['amount'], $b['date']]);
                $frugalDay = $sortedAsc[0];
            }
        }

        $weekdayRhythm = $this->buildWeekdayRhythm($user, $from, $to);
        $busiestWeekday = null;
        $maxWeekdayTotal = 0;
        foreach ($weekdayRhythm as $entry) {
            if ($entry['total'] > $maxWeekdayTotal) {
                $maxWeekdayTotal = $entry['total'];
                $busiestWeekday = $entry['iso_weekday'];
            }
        }

        $budgets = $this->buildBudgetsSummary($user, $from);

        if (! $hasData) {
            return [
                'month' => $from->format('Y-m'),
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'transaction_count' => 0,
                'has_data' => false,
                'summary' => null,
                'top_categories' => [],
                'most_frequent_category' => null,
                'biggest_day' => null,
                'frugal_day' => null,
                'no_spend_days' => $noSpendDays,
                'longest_no_spend_streak' => $longestNoSpendStreak,
                'daily_expense' => $dailyExpense,
                'weekday_rhythm' => $weekdayRhythm,
                'busiest_weekday' => null,
                'changes' => [],
                'biggest_transaction' => null,
                'logging' => [
                    'days_with_records' => 0,
                    'longest_logging_streak' => 0,
                ],
                'budgets' => $budgets,
                'persona' => [
                    'code' => 'explorer',
                    'reason' => ['kind' => 'not_enough_data'],
                ],
            ];
        }

        $categoriesData = $this->reports->categories($user, $from, $to, 'expense');
        $topCategories = array_map(
            fn ($c) => [
                'category_id' => $c['category_id'],
                'name' => $c['name'],
                'icon_key' => $c['icon_key'],
                'amount' => $c['amount'],
                'share_percent' => $c['share_percent'],
            ],
            array_slice($categoriesData['by_amount'], 0, 3)
        );

        $mostFrequent = null;
        if (count($categoriesData['by_count']) > 0) {
            $first = $categoriesData['by_count'][0];
            $mostFrequent = [
                'category_id' => $first['category_id'],
                'name' => $first['name'],
                'count' => $first['count'],
            ];
        }

        $prevHasData = $summaryData['previous']['income'] > 0 || $summaryData['previous']['expense'] > 0;
        $changes = [];
        if ($prevHasData) {
            $comparison = $this->reports->comparison($user, $from, $to);
            $changes = array_map(
                fn ($c) => [
                    'category_id' => $c['category_id'],
                    'name' => $c['name'],
                    'delta' => $c['delta'],
                    'direction' => $c['direction'],
                ],
                array_slice($comparison['contributors'], 0, 3)
            );
        }

        $biggestTxRow = DB::table('transactions')
            ->leftJoin('categories', 'categories.id', '=', 'transactions.category_id')
            ->where('transactions.user_id', $user->id)
            ->where('transactions.type', 'expense')
            ->whereNull('transactions.deleted_at')
            ->whereBetween('transactions.transaction_date', [$from->toDateString(), $to->toDateString()])
            ->orderByDesc('transactions.amount')
            ->orderByDesc('transactions.transaction_date')
            ->orderByDesc('transactions.id')
            ->select(
                'transactions.id',
                'transactions.amount',
                'transactions.transaction_date',
                'transactions.category_id',
                'categories.name AS category_name'
            )
            ->first();

        $biggestTransaction = $biggestTxRow ? [
            'id' => (int) $biggestTxRow->id,
            'amount' => (int) $biggestTxRow->amount,
            'category_id' => $biggestTxRow->category_id ? (int) $biggestTxRow->category_id : null,
            'category_name' => $biggestTxRow->category_name,
            'date' => Carbon::parse($biggestTxRow->transaction_date, 'Asia/Jakarta')->toDateString(),
        ] : null;

        $persona = $this->resolvePersona(
            transactionCount: $transactionCount,
            summaryData: $summaryData,
            budgets: $budgets,
            spendDayCount: $spendDayCount,
            biggestDay: $biggestDay,
            weekdayRhythm: $weekdayRhythm,
        );

        return [
            'month' => $from->format('Y-m'),
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'transaction_count' => $transactionCount,
            'has_data' => true,
            'summary' => [
                'income' => $summaryData['income'],
                'expense' => $summaryData['expense'],
                'net' => $summaryData['net'],
                'previous' => $prevHasData ? [
                    'income' => $summaryData['previous']['income'],
                    'expense' => $summaryData['previous']['expense'],
                    'net' => $summaryData['previous']['net'],
                    'income_change_percent' => $summaryData['previous']['income_change_percent'],
                    'expense_change_percent' => $summaryData['previous']['expense_change_percent'],
                    'net_change_percent' => $summaryData['previous']['net_change_percent'],
                ] : null,
                'comparison_basis' => $summaryData['comparison_basis'],
            ],
            'top_categories' => $topCategories,
            'most_frequent_category' => $mostFrequent,
            'biggest_day' => $biggestDay,
            'frugal_day' => $frugalDay,
            'no_spend_days' => $noSpendDays,
            'longest_no_spend_streak' => $longestNoSpendStreak,
            'daily_expense' => $dailyExpense,
            'weekday_rhythm' => $weekdayRhythm,
            'busiest_weekday' => $busiestWeekday,
            'changes' => $changes,
            'biggest_transaction' => $biggestTransaction,
            'logging' => [
                'days_with_records' => $daysWithRecords,
                'longest_logging_streak' => $longestLoggingStreak,
            ],
            'budgets' => $budgets,
            'persona' => $persona,
        ];
    }

    /**
     * @return array<int, array{iso_weekday: int, key: string, total: int, count: int}>
     */
    private function buildWeekdayRhythm(User $user, Carbon $from, Carbon $to): array
    {
        $buckets = [];
        foreach (self::WEEKDAY_KEYS as $iso => $key) {
            $buckets[$iso] = [
                'iso_weekday' => $iso,
                'key' => $key,
                'total' => 0,
                'count' => 0,
            ];
        }

        $rows = DB::table('transactions')
            ->where('user_id', $user->id)
            ->where('type', 'expense')
            ->whereNull('deleted_at')
            ->whereBetween('transaction_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('transaction_date')
            ->selectRaw('transaction_date, SUM(amount) AS total, COUNT(*) AS tx_count')
            ->get();

        foreach ($rows as $row) {
            $iso = Carbon::parse($row->transaction_date, 'Asia/Jakarta')->dayOfWeekIso;
            $buckets[$iso]['total'] += (int) $row->total;
            $buckets[$iso]['count'] += (int) $row->tx_count;
        }

        return array_values($buckets);
    }

    /**
     * @return array{total: int, healthy: int, warning: int, over: int}|null
     */
    private function buildBudgetsSummary(User $user, Carbon $monthStart): ?array
    {
        $budgets = Budget::query()
            ->where('user_id', $user->id)
            ->where('year', $monthStart->year)
            ->where('month', $monthStart->month)
            ->get();

        if ($budgets->isEmpty()) {
            return null;
        }

        $spentMap = $this->budgetProgress->forBudgets($budgets);
        $healthy = 0;
        $warning = 0;
        $over = 0;

        foreach ($budgets as $b) {
            $spent = (int) ($spentMap[$b->id] ?? 0);
            $limit = (int) $b->limit_amount;
            $scaledSpent = $spent * 100;

            if ($scaledSpent < $limit * 80) {
                $healthy++;
            } elseif ($scaledSpent <= $limit * 100) {
                $warning++;
            } else {
                $over++;
            }
        }

        return [
            'total' => $budgets->count(),
            'healthy' => $healthy,
            'warning' => $warning,
            'over' => $over,
        ];
    }

    private function resolvePersona(
        int $transactionCount,
        array $summaryData,
        ?array $budgets,
        int $spendDayCount,
        ?array $biggestDay,
        array $weekdayRhythm,
    ): array {
        if ($transactionCount < self::MIN_TRANSACTIONS_FOR_PERSONA) {
            return [
                'code' => 'explorer',
                'reason' => ['kind' => 'not_enough_data'],
            ];
        }

        $net = $summaryData['net'];
        $expense = $summaryData['expense'];
        $expenseChangePercent = $summaryData['previous']['expense_change_percent'];

        // 1. calm_saver
        if ($net > 0 && $expenseChangePercent !== null && $expenseChangePercent < 0) {
            return [
                'code' => 'calm_saver',
                'reason' => [
                    'expense_change_percent' => $expenseChangePercent,
                    'net' => $net,
                ],
            ];
        }

        // 2. budget_keeper
        if ($budgets !== null && $budgets['total'] >= 1 && $budgets['over'] === 0) {
            return [
                'code' => 'budget_keeper',
                'reason' => [
                    'total' => $budgets['total'],
                    'healthy' => $budgets['healthy'],
                    'warning' => $budgets['warning'],
                ],
            ];
        }

        // 3. recovery_month
        if ($net < 0 && $expenseChangePercent !== null && $expenseChangePercent < 0) {
            return [
                'code' => 'recovery_month',
                'reason' => [
                    'expense_change_percent' => $expenseChangePercent,
                ],
            ];
        }

        // 4. moment_hunter
        if ($spendDayCount >= self::MOMENT_HUNTER_MIN_SPEND_DAYS && $biggestDay !== null && $expense > 0) {
            $sharePercent = intdiv($biggestDay['amount'] * 100, $expense);
            if ($sharePercent >= self::MOMENT_HUNTER_DAY_SHARE_PERCENT) {
                return [
                    'code' => 'moment_hunter',
                    'reason' => [
                        'share_percent' => $sharePercent,
                        'date' => $biggestDay['date'],
                    ],
                ];
            }
        }

        // 5. weekend_king
        if ($expense > 0) {
            $weekendTotal = ($weekdayRhythm[5]['total'] ?? 0) + ($weekdayRhythm[6]['total'] ?? 0);
            $weekendSharePercent = intdiv($weekendTotal * 100, $expense);
            if ($weekendSharePercent >= self::WEEKEND_KING_SHARE_PERCENT) {
                return [
                    'code' => 'weekend_king',
                    'reason' => [
                        'weekend_share_percent' => $weekendSharePercent,
                    ],
                ];
            }
        }

        // 6. routine
        if ($transactionCount >= self::ROUTINE_MIN_TRANSACTIONS && $spendDayCount >= self::ROUTINE_MIN_ACTIVE_DAYS) {
            return [
                'code' => 'routine',
                'reason' => [
                    'transaction_count' => $transactionCount,
                    'active_days' => $spendDayCount,
                ],
            ];
        }

        // 7. explorer fallback
        return [
            'code' => 'explorer',
            'reason' => ['kind' => 'no_dominant_pattern'],
        ];
    }
}
