<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'source_wallet_id' => $this->source_wallet_id,
            'destination_wallet_id' => $this->destination_wallet_id,
            'amount' => $this->amount,
            'transfer_date' => $this->transfer_date->format('Y-m-d'),
            'notes' => $this->notes,
            'source_wallet' => $this->whenLoaded('sourceWallet', fn () => ['id' => $this->sourceWallet->id, 'name' => $this->sourceWallet->name]),
            'destination_wallet' => $this->whenLoaded('destinationWallet', fn () => ['id' => $this->destinationWallet->id, 'name' => $this->destinationWallet->name]),
        ];
    }
}
