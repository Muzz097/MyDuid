<?php

namespace App\Http\Controllers;

use App\Services\WrappedService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WrappedController extends Controller
{
    public function __construct(private WrappedService $wrapped) {}

    public function months(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->wrapped->months($request->user()),
        ]);
    }

    public function show(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
        ], [
            'month.required' => 'Parameter bulan wajib diisi.',
            'month.date_format' => 'Format bulan harus YYYY-MM.',
        ]);

        $monthStart = Carbon::createFromFormat('Y-m', $validated['month'], 'Asia/Jakarta')->startOfMonth();
        $currentMonthStart = Carbon::now('Asia/Jakarta')->startOfMonth();

        if ($monthStart->gte($currentMonthStart)) {
            return response()->json([
                'message' => 'Wrapped baru tersedia setelah bulan berakhir.',
                'errors' => [
                    'month' => ['Wrapped baru tersedia setelah bulan berakhir.'],
                ],
            ], 422);
        }

        return response()->json([
            'data' => $this->wrapped->show($request->user(), $monthStart),
        ]);
    }
}
