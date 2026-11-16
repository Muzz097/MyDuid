<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWalletRequest;
use App\Http\Requests\UpdateWalletRequest;
use App\Http\Resources\WalletResource;
use App\Models\Transfer;
use App\Models\Wallet;
use App\Services\BalanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function __construct(private BalanceService $balances) {}

    private function find(Request $request, int|string $id): Wallet
    {
        return $request->user()->wallets()->findOrFail($id);
    }

    private function present(Wallet $wallet): WalletResource
    {
        WalletResource::$balances = $this->balances->forWallets(collect([$wallet]));

        return new WalletResource($wallet);
    }

    public function index(Request $request)
    {
        $wallets = $request->user()->wallets()->orderBy('id')->get();
        WalletResource::$balances = $this->balances->forWallets($wallets);

        return WalletResource::collection($wallets);
    }

    public function store(StoreWalletRequest $request): JsonResponse
    {
        $data = $request->validated();
        $wallet = $request->user()->wallets()->create([
            'name' => $data['name'],
            'type' => $data['type'],
            'opening_balance' => $data['opening_balance'] ?? 0,
            'icon_type' => 'preset',
            'icon_key' => $data['icon_key'] ?? $data['type'],
        ]);

        return $this->present($wallet)->response()->setStatusCode(201);
    }

    public function show(Request $request, string $wallet)
    {
        $model = $this->find($request, $wallet);
        $this->authorize('view', $model);

        return $this->present($model);
    }

    public function update(UpdateWalletRequest $request, string $wallet)
    {
        $model = $this->find($request, $wallet);
        $this->authorize('update', $model);
        $model->update($request->validated());

        return $this->present($model->refresh());
    }

    public function archive(Request $request, string $wallet)
    {
        $model = $this->find($request, $wallet);
        $this->authorize('update', $model);
        $model->update(['is_active' => false]);

        return $this->present($model->refresh());
    }

    public function destroy(Request $request, string $wallet)
    {
        $model = $this->find($request, $wallet);
        $this->authorize('delete', $model);

        $hasHistory = $model->transactions()->withTrashed()->exists()
            || Transfer::withTrashed()
                ->where('source_wallet_id', $model->id)
                ->orWhere('destination_wallet_id', $model->id)->exists();

        if ($hasHistory) {
            return response()->json(['message' => 'Dompet memiliki riwayat, arsipkan saja.'], 422);
        }

        $model->delete();

        return response()->noContent();
    }
}
