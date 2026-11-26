<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\UpdateTransactionRequest;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    private function find(Request $request, int|string $id, bool $trashed = false): Transaction
    {
        $q = $request->user()->transactions();
        if ($trashed) {
            $q->withTrashed();
        }

        return $q->findOrFail($id);
    }

    public function index(Request $request)
    {
        $request->validate([
            'month'        => ['nullable', 'date_format:Y-m'],
            'date'         => ['nullable', 'date_format:Y-m-d'],
            'date_from'    => ['nullable', 'date_format:Y-m-d'],
            'date_to'      => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'wallet_id'    => ['nullable', 'integer'],
            'category_id'  => ['nullable', 'integer'],
            'category_ids' => ['nullable', 'string'],   // comma-separated integers
            'type'         => ['nullable', 'in:income,expense'],
            'search'       => ['nullable', 'string', 'max:200'],
            'per_page'     => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $q = $request->user()->transactions()->with(['wallet:id,name', 'category:id,name,icon_key']);

        // ---- Date range -------------------------------------------------------
        if ($d = $request->query('date')) {
            $q->where('transaction_date', $d);
        } elseif ($request->filled('date_from') || $request->filled('date_to')) {
            if ($request->filled('date_from')) {
                $q->where('transaction_date', '>=', $request->query('date_from'));
            }
            if ($request->filled('date_to')) {
                $q->where('transaction_date', '<=', $request->query('date_to'));
            }
        } elseif ($m = $request->query('month')) {
            $start = Carbon::createFromFormat('Y-m-d', $m.'-01', 'Asia/Jakarta')->startOfMonth();
            $q->whereBetween('transaction_date', [
                $start->toDateString(),
                $start->copy()->endOfMonth()->toDateString(),
            ]);
        }

        // ---- Exact filters ----------------------------------------------------
        if ($request->filled('wallet_id')) {
            $q->where('wallet_id', $request->query('wallet_id'));
        }
        if ($request->filled('type')) {
            $q->where('type', $request->query('type'));
        }

        // ---- Category filter: single id OR comma-separated ids ----------------
        if ($request->filled('category_ids')) {
            $ids = array_filter(
                array_map('intval', explode(',', $request->query('category_ids'))),
                fn ($v) => $v > 0
            );
            if (count($ids) === 1) {
                $q->where('category_id', reset($ids));
            } elseif (count($ids) > 1) {
                $q->whereIn('category_id', $ids);
            }
        } elseif ($request->filled('category_id')) {
            $q->where('category_id', $request->query('category_id'));
        }

        // ---- Full-text search over notes and related names --------------------
        if ($search = $request->query('search')) {
            $term = trim($search);
            $q->where(function ($sub) use ($term) {
                $sub->where('notes', 'ilike', "%{$term}%")
                    ->orWhereHas('category', fn ($cq) => $cq->where('name', 'ilike', "%{$term}%"))
                    ->orWhereHas('wallet',   fn ($wq) => $wq->where('name', 'ilike', "%{$term}%"));
            });
        }

        $perPage = min((int) ($request->query('per_page') ?? 25), 200);

        return TransactionResource::collection(
            $q->orderByDesc('transaction_date')->orderByDesc('id')->paginate($perPage)
        );
    }

    public function store(StoreTransactionRequest $request)
    {
        $tx = $request->user()->transactions()->create($request->validated());

        return (new TransactionResource($tx->load(['wallet:id,name', 'category:id,name,icon_key'])))
            ->response()->setStatusCode(201);
    }

    public function show(Request $request, string $transaction)
    {
        $tx = $this->find($request, $transaction);
        $this->authorize('view', $tx);

        return new TransactionResource($tx->load(['wallet:id,name', 'category:id,name,icon_key']));
    }

    public function update(UpdateTransactionRequest $request, string $transaction)
    {
        $tx = $this->find($request, $transaction);
        $this->authorize('update', $tx);
        $tx->update($request->validated());

        return new TransactionResource($tx->refresh()->load(['wallet:id,name', 'category:id,name,icon_key']));
    }

    public function destroy(Request $request, string $transaction)
    {
        $tx = $this->find($request, $transaction);
        $this->authorize('delete', $tx);
        $tx->delete();

        return response()->noContent();
    }

    public function restore(Request $request, string $transaction)
    {
        $tx = $this->find($request, $transaction, true);
        $this->authorize('restore', $tx);
        $tx->restore();

        return new TransactionResource($tx->load(['wallet:id,name', 'category:id,name,icon_key']));
    }
}
