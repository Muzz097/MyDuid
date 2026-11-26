<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WalletGoalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'wallet_id' => $this->wallet_id,
            'name' => $this->name,
            'target_amount' => (int) $this->target_amount,
            'starting_amount' => (int) $this->starting_amount,
            'deadline' => $this->deadline?->toDateString(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),

            // Progres — dilampirkan oleh GoalProgressService::attach()
            'balance' => (int) ($this->balance ?? 0),
            'percent' => (int) ($this->percent ?? 0),
            'remaining' => (int) ($this->remaining ?? $this->target_amount),
            'achieved' => (bool) ($this->achieved ?? false),
            'deadline_info' => $this->deadline_info ?? null,

            // Relasi dompet (whenLoaded)
            'wallet' => $this->whenLoaded('wallet', fn () => $this->wallet === null ? null : [
                'id' => $this->wallet->id,
                'name' => $this->wallet->name,
                'group' => $this->wallet->group,
            ]),
        ];
    }
}
