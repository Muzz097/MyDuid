<?php

namespace App\Http\Controllers\Auth;

use App\Actions\SeedDefaultCategories;
use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RegisterController extends Controller
{
    public function __invoke(RegisterRequest $request, SeedDefaultCategories $seed)
    {
        $user = DB::transaction(function () use ($request, $seed) {
            $user = User::create($request->validated());
            $seed($user);

            return $user;
        });

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return (new UserResource($user))->response()->setStatusCode(201);
    }
}
