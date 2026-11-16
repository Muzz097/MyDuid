<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;

uses(RefreshDatabase::class);

beforeEach(function () {
    RateLimiter::clear('login');
    $this->withHeaders(['Origin' => 'http://localhost:5173', 'Accept' => 'application/json']);
});

it('register membuat user dan 6 kategori bawaan', function () {
    $this->postJson('/api/register', [
        'name' => 'Rani', 'email' => 'rani@example.com',
        'password' => 'rahasia123', 'password_confirmation' => 'rahasia123',
    ])->assertCreated()->assertJsonPath('data.email', 'rani@example.com');

    $user = User::where('email', 'rani@example.com')->first();
    expect($user->categories()->count())->toBe(6)
        ->and($user->categories()->where('type', 'income')->count())->toBe(2);
});

it('menolak email duplikat', function () {
    User::factory()->create(['email' => 'a@example.com']);
    $this->postJson('/api/register', [
        'name' => 'X', 'email' => 'a@example.com',
        'password' => 'rahasia123', 'password_confirmation' => 'rahasia123',
    ])->assertStatus(422)->assertJsonValidationErrors('email');
});

it('login sukses lalu bisa membaca /api/user', function () {
    User::factory()->create(['email' => 'b@example.com', 'password' => 'rahasia123']);

    $this->postJson('/api/login', ['email' => 'b@example.com', 'password' => 'rahasia123'])->assertOk();
    $this->getJson('/api/user')->assertOk()->assertJsonPath('data.email', 'b@example.com');
});

it('login salah memberi 422 dengan pesan generik', function () {
    User::factory()->create(['email' => 'c@example.com', 'password' => 'rahasia123']);

    $salah = $this->postJson('/api/login', ['email' => 'c@example.com', 'password' => 'salah']);
    $takAda = $this->postJson('/api/login', ['email' => 'tidakada@example.com', 'password' => 'salah']);

    $salah->assertStatus(422);
    expect($salah->json('errors.email.0'))->toBe($takAda->json('errors.email.0'))
        ->and($salah->json('errors.email.0'))->toBe('Email atau kata sandi salah.');
});

it('/api/user butuh login', function () {
    $this->getJson('/api/user')->assertUnauthorized();
});

it('logout membuat /api/user kembali 401', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->postJson('/api/logout')->assertNoContent();
    $this->app['auth']->forgetGuards();

    $this->getJson('/api/user')->assertUnauthorized();
});

it('rate limit memblokir percobaan ke-6', function () {
    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/login', ['email' => 'd@example.com', 'password' => 'x'])->assertStatus(422);
    }
    $this->postJson('/api/login', ['email' => 'd@example.com', 'password' => 'x'])->assertStatus(429);
});
