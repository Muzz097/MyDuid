<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReportPeriodRequest;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private ReportService $reports) {}

    public function summary(ReportPeriodRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->reports->summary($request->user(), $request->fromDate(), $request->toDate()),
        ]);
    }

    public function cashflow(ReportPeriodRequest $request): JsonResponse
    {
        $validated = $request->validate([
            'granularity' => ['nullable', 'in:day,week,month'],
        ], [
            'granularity.in' => 'Granularitas harus berupa day, week, atau month.',
        ]);

        return response()->json([
            'data' => $this->reports->cashflow(
                $request->user(),
                $request->fromDate(),
                $request->toDate(),
                $validated['granularity'] ?? null
            ),
        ]);
    }

    public function categories(ReportPeriodRequest $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['nullable', 'in:income,expense'],
        ], [
            'type.in' => 'Tipe kategori harus income atau expense.',
        ]);

        return response()->json([
            'data' => $this->reports->categories(
                $request->user(),
                $request->fromDate(),
                $request->toDate(),
                $validated['type'] ?? 'expense'
            ),
        ]);
    }

    public function trends(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'months' => ['nullable', 'integer', 'min:1', 'max:24'],
        ], [
            'months.integer' => 'Jumlah bulan harus berupa angka bulat.',
            'months.min' => 'Jumlah bulan minimal 1.',
            'months.max' => 'Jumlah bulan maksimal 24.',
        ]);

        return response()->json([
            'data' => $this->reports->trends(
                $request->user(),
                (int) ($validated['months'] ?? 6)
            ),
        ]);
    }

    public function wallets(ReportPeriodRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->reports->wallets($request->user(), $request->fromDate(), $request->toDate()),
        ]);
    }

    public function comparison(ReportPeriodRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->reports->comparison($request->user(), $request->fromDate(), $request->toDate()),
        ]);
    }

    public function story(ReportPeriodRequest $request): JsonResponse
    {
        return response()->json([
            'data' => $this->reports->story($request->user(), $request->fromDate(), $request->toDate()),
        ]);
    }
}
