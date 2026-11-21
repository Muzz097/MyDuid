<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request, DashboardService $service)
    {
        $request->validate(['month' => ['nullable', 'date_format:Y-m']]);
        $month = $request->query('month', Carbon::now('Asia/Jakarta')->format('Y-m'));

        return response()->json(['data' => $service->forMonth($request->user(), $month)]);
    }
}
