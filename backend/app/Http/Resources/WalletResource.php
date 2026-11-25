<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WalletResource extends JsonResource
{
    /** Diisi controller dari BalanceService::forWallets */
    public static array $balances = [];

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'group' => $this->group,
            'card_theme' => $this->card_theme ?? 'default',
            'icon_type' => $this->icon_type,
            'icon_key' => $this->icon_key,
            'has_card_image' => (bool) $this->card_image_path,
            'is_active' => $this->is_active,
            'opening_balance' => $this->opening_balance,
            'balance' => self::$balances[$this->id] ?? $this->opening_balance,
        ];
    }
}
