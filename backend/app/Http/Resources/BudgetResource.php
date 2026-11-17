<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BudgetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $spent = (int) ($this->spent ?? 0);
        $limit = (int) $this->limit_amount;
        $scaledSpent = $spent * 100;
        $percent = intdiv($scaledSpent, $limit);
        $status = $scaledSpent < $limit * 80
            ? 'healthy'
            : ($scaledSpent <= $limit * 100 ? 'warning' : 'over');

        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'wallet_id' => $this->wallet_id,
            'year' => $this->year,
            'month' => $this->month,
            'limit_amount' => $limit,
            'spent' => $spent,
            'remaining' => $limit - $spent,
            'percent' => $percent,
            'status' => $status,
            'category' => $this->whenLoaded('category', fn () => $this->category === null ? null : [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'icon_key' => $this->category->icon_key,
            ]),
            'wallet' => $this->whenLoaded('wallet', fn () => $this->wallet === null ? null : [
                'id' => $this->wallet->id,
                'name' => $this->wallet->name,
            ]),
        ];
    }
}
