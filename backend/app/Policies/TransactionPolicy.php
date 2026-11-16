<?php

namespace App\Policies;

use App\Models\Transaction;
use App\Models\User;

class TransactionPolicy
{
    public function view(User $user, Transaction $t): bool { return $t->user_id === $user->id; }
    public function update(User $user, Transaction $t): bool { return $t->user_id === $user->id; }
    public function delete(User $user, Transaction $t): bool { return $t->user_id === $user->id; }
    public function restore(User $user, Transaction $t): bool { return $t->user_id === $user->id; }
}