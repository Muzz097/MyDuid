<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request, DashboardService $service)
    {
        $request->validate([
            'month' => ['nullable', 'date_format:Y-m', 'regex:/^\d{4}-(0[1-9]|1[0-2])$/'],
        ], [
            'month.date_format' => 'Format bulan harus YYYY-MM.',
            'month.regex' => 'Bulan harus berada di antara 01 dan 12.',
        ]);
        $month = $request->query('month', Carbon::now('Asia/Jakarta')->format('Y-m'));

        return response()->json(['data' => $service->forMonth($request->user(), $month)]);
    }
}
