<?php

namespace App\Services;

use App\Models\Budget;
use Carbon\Carbon;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class BudgetProgressService
{
    /**
     * @param  Collection<int, Budget>  $budgets
     * @return array<int, int> budget_id => spent
     */
    public function forBudgets(Collection $budgets): array
    {
        if ($budgets->isEmpty()) {
            return [];
        }

        return DB::table('budgets')
            ->leftJoin('transactions', function (JoinClause $join) use ($budgets) {
                $join->on('transactions.user_id', '=', 'budgets.user_id')
                    ->where('transactions.type', '=', 'expense')
                    ->whereNull('transactions.deleted_at')
                    ->where(function ($query) use ($budgets) {
                        foreach ($budgets as $budget) {
                            $start = Carbon::create((int) $budget->year, (int) $budget->month, 1)->toDateString();
                            $end = Carbon::create((int) $budget->year, (int) $budget->month, 1)->endOfMonth()->toDateString();

                            $query->orWhere(function ($query) use ($budget, $start, $end) {
                                $query->where('budgets.id', $budget->id)
                                    ->whereBetween('transactions.transaction_date', [$start, $end]);

                                if ($budget->category_id !== null) {
                                    $query->where('transactions.category_id', $budget->category_id);
                                }
                                if ($budget->wallet_id !== null) {
                                    $query->where('transactions.wallet_id', $budget->wallet_id);
                                }
                            });
                        }
                    });
            })
            ->whereIn('budgets.id', $budgets->pluck('id'))
            ->selectRaw('budgets.id AS budget_id, COALESCE(SUM(transactions.amount), 0) AS spent')
            ->groupBy('budgets.id')
            ->get()
            ->mapWithKeys(fn (object $row) => [(int) $row->budget_id => (int) $row->spent])
            ->all();
    }
}
