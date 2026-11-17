<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'wallet_id' => $this->wallet_id,
            'category_id' => $this->category_id,
            'type' => $this->type,
            'amount' => $this->amount,
            'transaction_date' => $this->transaction_date->format('Y-m-d'),
            'notes' => $this->notes,
            'wallet' => $this->whenLoaded('wallet', fn () => ['id' => $this->wallet->id, 'name' => $this->wallet->name]),
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id, 'name' => $this->category->name, 'icon_key' => $this->category->icon_key,
            ]),
        ];
    }
}
