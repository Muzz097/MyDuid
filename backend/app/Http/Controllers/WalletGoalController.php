<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWalletGoalRequest;
use App\Http\Requests\UpdateWalletGoalRequest;
use App\Http\Resources\WalletGoalResource;
use App\Models\Wallet;
use App\Models\WalletGoal;
use App\Services\BalanceService;
use App\Services\GoalProgressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletGoalController extends Controller
{
    public function __construct(
        private readonly BalanceService $balances,
        private readonly GoalProgressService $progress,
    ) {}

    /**
     * Temukan dompet milik pengguna yang terautentikasi atau lempar 404.
     */
    private function findWallet(Request $request, int|string $walletId): Wallet
    {
        return $request->user()->wallets()->findOrFail($walletId);
    }

    /**
     * Hitung saldo dompet dan lampirkan progres ke goal.
     */
    private function withProgress(WalletGoal $goal, Wallet $wallet): WalletGoal
    {
        $balance = $this->balances->forWallet($wallet);
        $this->progress->attach($goal, $balance);

        return $goal;
    }

    /**
     * GET /wallets/{wallet}/goal
     * Tampilkan goal milik dompet, atau 404 jika belum ada.
     */
    public function show(Request $request, string $wallet): WalletGoalResource
    {
        $model  = $this->findWallet($request, $wallet);
        $this->authorize('view', $model);

        /** @var WalletGoal $goal */
        $goal = $model->goal()->with('wallet:id,name,group')->firstOrFail();
        $this->authorize('view', $goal);

        return new WalletGoalResource($this->withProgress($goal, $model));
    }

    /**
     * POST /wallets/{wallet}/goal
     * Buat goal baru untuk dompet Tabungan yang belum punya goal.
     */
    public function store(StoreWalletGoalRequest $request, string $wallet): JsonResponse
    {
        $model = $this->findWallet($request, $wallet);
        $this->authorize('update', $model); // memiliki dompet berarti bisa mengelola goal-nya

        /** @var WalletGoal $goal */
        $goal = $request->user()->walletGoals()->create(array_merge(
            $request->validated(),
            ['wallet_id' => $model->id],
        ));

        $goal->load('wallet:id,name,group');

        return (new WalletGoalResource($this->withProgress($goal, $model)))->response()->setStatusCode(201);
    }

    /**
     * PUT /wallets/{wallet}/goal
     * Perbarui goal yang ada.
     */
    public function update(UpdateWalletGoalRequest $request, string $wallet): WalletGoalResource
    {
        $model = $this->findWallet($request, $wallet);
        $this->authorize('update', $model);

        /** @var WalletGoal $goal */
        $goal = $model->goal()->firstOrFail();
        $this->authorize('update', $goal);

        $goal->update($request->validated());
        $goal->refresh()->load('wallet:id,name,group');

        return new WalletGoalResource($this->withProgress($goal, $model));
    }

    /**
     * DELETE /wallets/{wallet}/goal
     * Hapus goal.
     */
    public function destroy(Request $request, string $wallet): \Illuminate\Http\Response
    {
        $model = $this->findWallet($request, $wallet);
        $this->authorize('update', $model);

        /** @var WalletGoal $goal */
        $goal = $model->goal()->firstOrFail();
        $this->authorize('delete', $goal);

        $goal->delete();

        return response()->noContent();
    }
}
