<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTransferRequest;
use App\Http\Resources\TransferResource;
use App\Models\Transfer;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransferController extends Controller
{
    private const WITH = ['sourceWallet:id,name', 'destinationWallet:id,name'];

    private function find(Request $request, int|string $id, bool $trashed = false): Transfer
    {
        $q = $request->user()->transfers();
        if ($trashed) {
            $q->withTrashed();
        }

        return $q->findOrFail($id);
    }

    public function index(Request $request)
    {
        $request->validate([
            'month'     => ['nullable', 'date_format:Y-m'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to'   => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'wallet_id' => ['nullable', 'integer'],
            'search'    => ['nullable', 'string', 'max:200'],
            'per_page'  => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $q = $request->user()->transfers()->with(self::WITH);

        // ---- Date range -------------------------------------------------------
        if ($request->filled('date_from') || $request->filled('date_to')) {
            if ($request->filled('date_from')) {
                $q->where('transfer_date', '>=', $request->query('date_from'));
            }
            if ($request->filled('date_to')) {
                $q->where('transfer_date', '<=', $request->query('date_to'));
            }
        } elseif ($m = $request->query('month')) {
            $start = Carbon::createFromFormat('Y-m-d', $m.'-01', 'Asia/Jakarta')->startOfMonth();
            $q->whereBetween('transfer_date', [
                $start->toDateString(),
                $start->copy()->endOfMonth()->toDateString(),
            ]);
        }

        // ---- Wallet filter (source OR destination) ----------------------------
        if ($request->filled('wallet_id')) {
            $wid = (int) $request->query('wallet_id');
            $q->where(fn ($s) => $s->where('source_wallet_id', $wid)
                ->orWhere('destination_wallet_id', $wid));
        }

        // ---- Text search over notes and wallet names --------------------------
        if ($search = $request->query('search')) {
            $term = trim($search);
            $q->where(function ($sub) use ($term) {
                $sub->where('notes', 'ilike', "%{$term}%")
                    ->orWhereHas('sourceWallet',      fn ($wq) => $wq->where('name', 'ilike', "%{$term}%"))
                    ->orWhereHas('destinationWallet', fn ($wq) => $wq->where('name', 'ilike', "%{$term}%"));
            });
        }

        $perPage = min((int) ($request->query('per_page') ?? 25), 200);

        return TransferResource::collection(
            $q->orderByDesc('transfer_date')->orderByDesc('id')->paginate($perPage)
        );
    }

    public function store(StoreTransferRequest $request)
    {
        // Satu baris = satu transfer; DB::transaction menjaga atomisitas.
        $transfer = DB::transaction(
            fn () => $request->user()->transfers()->create($request->validated())
        );

        return (new TransferResource($transfer->load(self::WITH)))->response()->setStatusCode(201);
    }

    public function show(Request $request, string $transfer)
    {
        $model = $this->find($request, $transfer);
        $this->authorize('view', $model);

        return new TransferResource($model->load(self::WITH));
    }

    public function destroy(Request $request, string $transfer)
    {
        $model = $this->find($request, $transfer);
        $this->authorize('delete', $model);
        $model->delete();

        return response()->noContent();
    }

    public function restore(Request $request, string $transfer)
    {
        $model = $this->find($request, $transfer, true);
        $this->authorize('restore', $model);
        $model->restore();

        return new TransferResource($model->load(self::WITH));
    }
}
