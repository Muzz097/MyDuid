<?php

namespace App\Http\Resources;

use App\Models\Transaction;
use App\Models\Transfer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

class WalletActivityResource extends JsonResource
{
    /**
     * The wallet ID used to determine transfer direction.
     */
    private int $walletId;

    public function __construct(Transaction|Transfer $resource, int $walletId)
    {
        parent::__construct($resource);
        $this->walletId = $walletId;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        if ($this->resource instanceof Transaction) {
            return $this->formatTransaction();
        }

        return $this->formatTransfer();
    }

    /**
     * @return array<string, mixed>
     */
    private function formatTransaction(): array
    {
        /** @var Transaction $tx */
        $tx = $this->resource;

        return [
            'kind' => 'transaction',
            'id' => $tx->id,
            'date' => $tx->transaction_date->toDateString(),
            'amount' => $tx->amount,
            'notes' => $tx->notes,
            'type' => $tx->type,
            'category' => $tx->relationLoaded('category') && $tx->category
                ? [
                    'id' => $tx->category->id,
                    'name' => $tx->category->name,
                    'icon_key' => $tx->category->icon_key,
                ]
                : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatTransfer(): array
    {
        /** @var Transfer $tr */
        $tr = $this->resource;

        $isOutgoing = $tr->source_wallet_id === $this->walletId;

        $counterpartyWallet = $isOutgoing
            ? $tr->destinationWallet
            : $tr->sourceWallet;

        return [
            'kind' => 'transfer',
            'id' => $tr->id,
            'date' => $tr->transfer_date->toDateString(),
            'amount' => $tr->amount,
            'notes' => $tr->notes,
            'direction' => $isOutgoing ? 'out' : 'in',
            'counterparty_wallet' => $counterpartyWallet
                ? [
                    'id' => $counterpartyWallet->id,
                    'name' => $counterpartyWallet->name,
                ]
                : null,
        ];
    }

    /**
     * Create a collection of activity items scoped to a wallet.
     *
     * @param  Collection<int, Transaction|Transfer>  $items
     * @return array<int, array<string, mixed>>
     */
    public static function collectionForWallet($items, int $walletId): array
    {
        return $items->map(fn ($item) => (new self($item, $walletId))->resolve())->all();
    }
}
