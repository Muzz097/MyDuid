<?php

namespace App\Policies;

use App\Models\Transfer;
use App\Models\User;

class TransferPolicy
{
    public function view(User $user, Transfer $t): bool
    {
        return $t->user_id === $user->id;
    }

    public function delete(User $user, Transfer $t): bool
    {
        return $t->user_id === $user->id;
    }

    public function restore(User $user, Transfer $t): bool
    {
        return $t->user_id === $user->id;
    }
}
