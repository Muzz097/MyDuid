<?php

namespace App\Services;

use App\Models\WalletGoal;
use Carbon\Carbon;

class GoalProgressService
{
    private const JAKARTA = 'Asia/Jakarta';

    /**
     * Hitung dan lampirkan data progres ke goal.
     * Semua kalkulasi uang menggunakan integer Rupiah (tidak ada float).
     */
    public function attach(WalletGoal $goal, int $balance): void
    {
        $target    = (int) $goal->target_amount;
        $percent   = (int) intdiv($balance * 100, $target);         // floor otomatis dari intdiv
        $percent   = min($percent, 100);                            // cap 100 %
        $remaining = max($target - $balance, 0);                    // tidak boleh negatif
        $achieved  = $balance >= $target;

        // Tandai completed_at jika baru tercapai atau belum di-unset saat sudah tidak tercapai
        if ($achieved && $goal->completed_at === null) {
            $goal->completed_at = now();
            $goal->saveQuietly();
        } elseif (! $achieved && $goal->completed_at !== null) {
            $goal->completed_at = null;
            $goal->saveQuietly();
        }

        // Info deadline & estimasi setoran mingguan
        $deadlineInfo = null;

        if ($goal->deadline !== null && ! $achieved) {
            $now      = Carbon::now(self::JAKARTA)->startOfDay();
            $deadline = Carbon::parse($goal->deadline, self::JAKARTA)->startOfDay();
            $daysLeft = (int) $now->diffInDays($deadline, false); // negatif bila lewat

            if ($daysLeft < 0) {
                // Tenggat sudah lewat
                $deadlineInfo = [
                    'deadline'          => $goal->deadline->toDateString(),
                    'days_left'         => $daysLeft,
                    'status'            => 'Tenggat terlewat',
                    'weekly_deposit'    => null,
                    'deposit_note'      => null,
                ];
            } else {
                // Tenggat belum lewat — hitung estimasi setoran
                $weeksLeft    = (int) ceil(max($daysLeft, 1) / 7); // minimum 1 minggu
                $weeklyDeposit = (int) intdiv($remaining + $weeksLeft - 1, $weeksLeft); // ceil integer

                $deadlineInfo = [
                    'deadline'       => $goal->deadline->toDateString(),
                    'days_left'      => $daysLeft,
                    'status'         => 'Dalam tenggat',
                    'weekly_deposit' => $weeklyDeposit,
                    'deposit_note'   => 'Perkiraan setoran per minggu. Ini adalah estimasi, bukan jaminan.',
                ];
            }
        } elseif ($goal->deadline !== null && $achieved) {
            $deadlineInfo = [
                'deadline'       => $goal->deadline->toDateString(),
                'days_left'      => null,
                'status'         => 'Tercapai',
                'weekly_deposit' => null,
                'deposit_note'   => null,
            ];
        }

        $goal->setAttribute('balance', $balance);
        $goal->setAttribute('percent', $percent);
        $goal->setAttribute('remaining', $remaining);
        $goal->setAttribute('achieved', $achieved);
        $goal->setAttribute('deadline_info', $deadlineInfo);
    }
}
