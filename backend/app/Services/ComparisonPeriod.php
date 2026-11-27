<?php

namespace App\Services;

use Carbon\Carbon;

class ComparisonPeriod
{
    /**
     * Resolve a fair previous comparison period for the given date range.
     *
     * @return array{from: Carbon, to: Carbon, basis: string}
     */
    public static function resolve(Carbon $from, Carbon $to): array
    {
        $start = $from->copy()->timezone('Asia/Jakarta')->startOfDay();
        $end = $to->copy()->timezone('Asia/Jakarta')->startOfDay();

        $isFullMonth = $start->day === 1 && $end->isSameDay($start->copy()->endOfMonth());
        if ($isFullMonth) {
            $prevStart = $start->copy()->subMonthNoOverflow()->startOfMonth();

            return [
                'from' => $prevStart,
                'to' => $prevStart->copy()->endOfMonth(),
                'basis' => 'previous_month',
            ];
        }

        if ($start->day === 1 && $end->lt($start->copy()->endOfMonth())) {
            $prevStart = $start->copy()->subMonthNoOverflow()->startOfMonth();
            $clampedDay = min($end->day, $prevStart->daysInMonth);

            return [
                'from' => $prevStart,
                'to' => $prevStart->copy()->day($clampedDay),
                'basis' => 'same_days_previous_month',
            ];
        }

        $diffDays = (int) $start->diffInDays($end);
        $prevEnd = $start->copy()->subDay();

        return [
            'from' => $prevEnd->copy()->subDays($diffDays),
            'to' => $prevEnd,
            'basis' => 'previous_equal_period',
        ];
    }
}
