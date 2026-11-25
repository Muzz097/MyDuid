<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWalletRequest;
use App\Http\Requests\UpdateWalletRequest;
use App\Http\Resources\WalletActivityResource;
use App\Http\Resources\WalletResource;
use App\Models\Transaction;
use App\Models\Transfer;
use App\Models\Wallet;
use App\Services\BalanceService;
use App\Services\GoalProgressService;
use App\Services\WalletCardImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class WalletController extends Controller
{
    public function __construct(
        private BalanceService $balances,
        private WalletCardImageService $cardImages,
        private GoalProgressService $goalProgress,
    ) {}

    private function find(Request $request, int|string $id): Wallet
    {
        return $request->user()->wallets()->findOrFail($id);
    }

    private function present(Wallet $wallet): WalletResource
    {
        $wallet->loadMissing('goal');
        $balances = $this->balances->forWallets(collect([$wallet]));
        WalletResource::$balances = $balances;

        if ($wallet->goal !== null) {
            $this->goalProgress->attach($wallet->goal, $balances[$wallet->id] ?? (int) $wallet->opening_balance);
        }

        return new WalletResource($wallet);
    }

    public function index(Request $request)
    {
        $wallets = $request->user()->wallets()->with('goal')->orderBy('id')->get();
        $balances = $this->balances->forWallets($wallets);
        WalletResource::$balances = $balances;

        foreach ($wallets as $wallet) {
            if ($wallet->goal !== null) {
                $this->goalProgress->attach($wallet->goal, $balances[$wallet->id] ?? (int) $wallet->opening_balance);
            }
        }

        return WalletResource::collection($wallets);
    }

    public function store(StoreWalletRequest $request): JsonResponse
    {
        $data = $request->validated();
        $wallet = $request->user()->wallets()->create([
            'name' => $data['name'],
            'type' => $data['type'],
            'group' => $data['group'] ?? 'daily',
            'card_theme' => $data['card_theme'] ?? 'default',
            'opening_balance' => $data['opening_balance'] ?? 0,
            'icon_type' => $data['icon_type'] ?? 'preset',
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

    public function activity(Request $request, string $wallet)
    {
        $model = $this->find($request, $wallet);
        $this->authorize('view', $model);

        $validator = Validator::make($request->query(), [
            'month' => ['sometimes', 'date_format:Y-m'],
            'type' => ['sometimes', 'in:all,income,expense,transfer'],
            'page' => ['sometimes', 'integer', 'min:1'],
        ], [
            'month.date_format' => 'Format bulan harus YYYY-MM.',
            'type.in' => 'Tipe harus salah satu dari: all, income, expense, transfer.',
            'page.integer' => 'Halaman harus berupa angka.',
            'page.min' => 'Halaman minimal 1.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Data tidak valid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $userId = $request->user()->id;
        $walletId = $model->id;
        $month = $request->query('month');
        $type = $request->query('type', 'all');
        $perPage = 20;

        $wantTransactions = in_array($type, ['all', 'income', 'expense']);
        $wantTransfers = in_array($type, ['all', 'transfer']);

        // Build a UNION query for stable ordering across both tables.
        $subQueries = [];

        if ($wantTransactions) {
            $txQuery = DB::table('transactions')
                ->select(
                    DB::raw("'transaction' as kind"),
                    'id',
                    'transaction_date as activity_date',
                    'created_at',
                )
                ->where('user_id', $userId)
                ->where('wallet_id', $walletId)
                ->whereNull('deleted_at');

            if ($type === 'income') {
                $txQuery->where('type', 'income');
            } elseif ($type === 'expense') {
                $txQuery->where('type', 'expense');
            }

            if ($month) {
                $txQuery->whereRaw("to_char(transaction_date, 'YYYY-MM') = ?", [$month]);
            }

            $subQueries[] = $txQuery;
        }

        if ($wantTransfers) {
            $trQuery = DB::table('transfers')
                ->select(
                    DB::raw("'transfer' as kind"),
                    'id',
                    'transfer_date as activity_date',
                    'created_at',
                )
                ->where('user_id', $userId)
                ->where(function ($q) use ($walletId) {
                    $q->where('source_wallet_id', $walletId)
                        ->orWhere('destination_wallet_id', $walletId);
                })
                ->whereNull('deleted_at');

            if ($month) {
                $trQuery->whereRaw("to_char(transfer_date, 'YYYY-MM') = ?", [$month]);
            }

            $subQueries[] = $trQuery;
        }

        if (empty($subQueries)) {
            return response()->json([
                'data' => [],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => $perPage, 'total' => 0],
            ]);
        }

        // Build UNION
        $union = array_shift($subQueries);
        foreach ($subQueries as $sub) {
            $union = $union->unionAll($sub);
        }

        $page = (int) $request->query('page', 1);
        $countQuery = DB::query()->fromSub($union, 'activity');
        $total = $countQuery->count();
        $lastPage = max(1, (int) ceil($total / $perPage));

        $rows = DB::query()->fromSub($union, 'activity')
            ->orderByDesc('activity_date')
            ->orderByDesc('id')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get();

        // Eager-load full models for the resource
        $txIds = $rows->where('kind', 'transaction')->pluck('id')->all();
        $trIds = $rows->where('kind', 'transfer')->pluck('id')->all();

        $transactions = ! empty($txIds)
            ? Transaction::with('category')->whereIn('id', $txIds)->get()->keyBy('id')
            : collect();

        $transfers = ! empty($trIds)
            ? Transfer::with(['sourceWallet', 'destinationWallet'])->whereIn('id', $trIds)->get()->keyBy('id')
            : collect();

        // Map rows back to models in the correct order
        $items = $rows->map(function ($row) use ($transactions, $transfers) {
            return $row->kind === 'transaction'
                ? $transactions->get($row->id)
                : $transfers->get($row->id);
        })->filter();

        return response()->json([
            'data' => WalletActivityResource::collectionForWallet($items, $walletId),
            'meta' => [
                'current_page' => $page,
                'last_page' => $lastPage,
                'per_page' => $perPage,
                'total' => $total,
            ],
        ]);
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

        // Hapus foto kartu bila ada
        if ($model->card_image_path) {
            $this->cardImages->delete($model->card_image_path);
        }

        $model->delete();

        return response()->noContent();
    }
}
