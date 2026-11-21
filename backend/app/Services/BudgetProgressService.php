<?php

namespace App\Services;

use App\Models\Budget;
use Carbon\Carbon;
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
        $result = [];

        foreach ($budgets as $b) {
            $start = Carbon::create((int) $b->year, (int) $b->month, 1);

            $q = DB::table('transactions')
                ->where('user_id', $b->user_id)
                ->where('type', 'expense')
                ->whereNull('deleted_at')
                ->whereBetween('transaction_date', [
                    $start->toDateString(),
                    $start->copy()->endOfMonth()->toDateString(),
                ]);

            if ($b->category_id !== null) {
                $q->where('category_id', $b->category_id);
            }
            if ($b->wallet_id !== null) {
                $q->where('wallet_id', $b->wallet_id);
            }

            $result[$b->id] = (int) $q->sum('amount');
        }

        return $result;
    }
}
