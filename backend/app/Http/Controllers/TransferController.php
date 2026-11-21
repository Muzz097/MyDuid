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
        $request->validate(['month' => ['nullable', 'date_format:Y-m']]);

        $q = $request->user()->transfers()->with(self::WITH);

        if ($m = $request->query('month')) {
            $start = Carbon::createFromFormat('Y-m-d', $m.'-01', 'Asia/Jakarta')->startOfMonth();
            $q->whereBetween('transfer_date', [$start->toDateString(), $start->copy()->endOfMonth()->toDateString()]);
        }

        return TransferResource::collection(
            $q->orderByDesc('transfer_date')->orderByDesc('id')->paginate(20)
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
