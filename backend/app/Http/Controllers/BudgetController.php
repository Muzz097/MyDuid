<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBudgetRequest;
use App\Http\Requests\UpdateBudgetRequest;
use App\Http\Resources\BudgetResource;
use App\Models\Budget;
use App\Services\BudgetProgressService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class BudgetController extends Controller
{
    public function __construct(private readonly BudgetProgressService $progressService) {}

    private function find(Request $request, int|string $id): Budget
    {
        return $request->user()->budgets()->findOrFail($id);
    }

    private function addProgress(Collection $budgets): void
    {
        $spent = $this->progressService->forBudgets($budgets);

        foreach ($budgets as $budget) {
            $budget->setAttribute('spent', $spent[$budget->id] ?? 0);
        }
    }

    public function index(Request $request)
    {
        $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
        ], [
            'month.date_format' => 'Format bulan harus YYYY-MM.',
        ]);
        $this->authorize('viewAny', Budget::class);

        $month = $request->query('month', Carbon::now('Asia/Jakarta')->format('Y-m'));
        $period = Carbon::createFromFormat('Y-m-d', $month.'-01', 'Asia/Jakarta');
        $budgets = $request->user()->budgets()
            ->with(['category:id,name,icon_key', 'wallet:id,name'])
            ->where('year', $period->year)
            ->where('month', $period->month)
            ->orderByDesc('id')
            ->paginate(20);

        $this->addProgress($budgets->getCollection());

        return BudgetResource::collection($budgets);
    }

    public function store(StoreBudgetRequest $request)
    {
        $this->authorize('create', Budget::class);
        $budget = $request->user()->budgets()->create($request->validated());
        $budget->load(['category:id,name,icon_key', 'wallet:id,name']);
        $this->addProgress(collect([$budget]));

        return (new BudgetResource($budget))->response()->setStatusCode(201);
    }

    public function show(Request $request, string $budget)
    {
        $model = $this->find($request, $budget);
        $this->authorize('view', $model);
        $model->load(['category:id,name,icon_key', 'wallet:id,name']);
        $this->addProgress(collect([$model]));

        return new BudgetResource($model);
    }

    public function update(UpdateBudgetRequest $request, string $budget)
    {
        $model = $this->find($request, $budget);
        $this->authorize('update', $model);
        $model->update($request->validated());
        $model->refresh()->load(['category:id,name,icon_key', 'wallet:id,name']);
        $this->addProgress(collect([$model]));

        return new BudgetResource($model);
    }

    public function destroy(Request $request, string $budget)
    {
        $model = $this->find($request, $budget);
        $this->authorize('delete', $model);
        $model->delete();

        return response()->noContent();
    }
}
