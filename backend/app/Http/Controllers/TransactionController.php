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
            'month' => ['nullable', 'date_format:Y-m'],
            'wallet_id' => ['nullable', 'integer'],
            'category_id' => ['nullable', 'integer'],
            'type' => ['nullable', 'in:income,expense'],
        ]);

        $q = $request->user()->transactions()->with(['wallet:id,name', 'category:id,name,icon_key']);

        if ($m = $request->query('month')) {
            $start = Carbon::createFromFormat('Y-m-d', $m.'-01', 'Asia/Jakarta')->startOfMonth();
            $q->whereBetween('transaction_date', [$start->toDateString(), $start->copy()->endOfMonth()->toDateString()]);
        }
        foreach (['wallet_id', 'category_id', 'type'] as $f) {
            if ($request->filled($f)) {
                $q->where($f, $request->query($f));
            }
        }

        return TransactionResource::collection(
            $q->orderByDesc('transaction_date')->orderByDesc('id')->paginate(20)
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
