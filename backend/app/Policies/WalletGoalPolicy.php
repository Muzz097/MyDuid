<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WalletGoal;

class WalletGoalPolicy
{
    public function view(User $user, WalletGoal $goal): bool
    {
        return $goal->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, WalletGoal $goal): bool
    {
        return $goal->user_id === $user->id;
    }

    public function delete(User $user, WalletGoal $goal): bool
    {
        return $goal->user_id === $user->id;
    }
}
