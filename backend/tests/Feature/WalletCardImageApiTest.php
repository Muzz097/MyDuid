<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

// ---------------------------------------------------------------------------
// Helper: buat UploadedFile dari gambar GD nyata
// ---------------------------------------------------------------------------

function makeTestImage(int $w = 400, int $h = 400, string $ext = 'jpg'): UploadedFile
{
    $tmp = tempnam(sys_get_temp_dir(), 'img_').'.'.$ext;
    $img = imagecreatetruecolor($w, $h);
    // Isi warna solid supaya tidak kosong
    $color = imagecolorallocate($img, 180, 90, 60);
    imagefill($img, 0, 0, $color);

    match ($ext) {
        'png' => imagepng($img, $tmp),
        'webp' => imagewebp($img, $tmp),
        default => imagejpeg($img, $tmp),
    };
    imagedestroy($img);

    $mime = match ($ext) {
        'png' => 'image/png',
        'webp' => 'image/webp',
        default => 'image/jpeg',
    };

    return new UploadedFile($tmp, 'test.'.$ext, $mime, null, true);
}

function makeSmallImage(int $w = 100, int $h = 100): UploadedFile
{
    return makeTestImage($w, $h, 'jpg');
}

// ---------------------------------------------------------------------------
// Setup umum
// ---------------------------------------------------------------------------

beforeEach(function () {
    $this->withHeaders(['Origin' => 'http://localhost:5173', 'Accept' => 'application/json']);
});

// ---------------------------------------------------------------------------
// Tanpa login → 401
// ---------------------------------------------------------------------------

it('menolak tanpa login untuk semua endpoint foto kartu', function () {
    $u = User::factory()->create();
    $w = $u->wallets()->create(['name' => 'Kas', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);

    $this->postJson("/api/wallets/{$w->id}/card-image")->assertUnauthorized();
    $this->getJson("/api/wallets/{$w->id}/card-image")->assertUnauthorized();
    $this->deleteJson("/api/wallets/{$w->id}/card-image")->assertUnauthorized();
});

// ---------------------------------------------------------------------------
// User B tidak bisa akses dompet User A → 404
// ---------------------------------------------------------------------------

it('user B mendapat 404 untuk POST GET DELETE foto kartu milik user A', function () {
    $a = User::factory()->create();
    $b = User::factory()->create();
    $w = $a->wallets()->create(['name' => 'Kas A', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);

    $this->actingAs($b);

    $this->postJson("/api/wallets/{$w->id}/card-image", [
        'image' => makeTestImage(),
    ])->assertNotFound();

    $this->getJson("/api/wallets/{$w->id}/card-image")->assertNotFound();

    $this->deleteJson("/api/wallets/{$w->id}/card-image")->assertNotFound();
});

// ---------------------------------------------------------------------------
// Upload valid JPEG
// ---------------------------------------------------------------------------

it('upload JPEG valid berhasil dan menyimpan file di storage private', function () {
    $u = User::factory()->create();
    $w = $u->wallets()->create(['name' => 'Kas', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);

    $response = $this->actingAs($u)->postJson("/api/wallets/{$w->id}/card-image", [
        'image' => makeTestImage(400, 400, 'jpg'),
    ]);

    $response->assertOk()->assertJsonPath('has_card_image', true);

    $w->refresh();
    expect($w->card_image_path)->not->toBeNull();

    // File ada di storage private (storage/app/private/)
    $fullPath = storage_path('app/private/'.$w->card_image_path);
    expect(file_exists($fullPath))->toBeTrue();

    // File TIDAK berada di public storage
    $publicPath = storage_path('app/public/'.$w->card_image_path);
    expect(file_exists($publicPath))->toBeFalse();
});

// ---------------------------------------------------------------------------
// Upload valid PNG
// ---------------------------------------------------------------------------

it('upload PNG valid berhasil', function () {
    $u = User::factory()->create();
    $w = $u->wallets()->create(['name' => 'Tabungan', 'type' => 'bank', 'icon_type' => 'preset', 'icon_key' => 'bank']);

    $this->actingAs($u)->postJson("/api/wallets/{$w->id}/card-image", [
        'image' => makeTestImage(500, 500, 'png'),
    ])->assertOk()->assertJsonPath('has_card_image', true);
});

// ---------------------------------------------------------------------------
// Upload valid WebP
// ---------------------------------------------------------------------------

it('upload WebP valid berhasil', function () {
    $u = User::factory()->create();
    $w = $u->wallets()->create(['name' => 'E-wallet', 'type' => 'ewallet', 'icon_type' => 'preset', 'icon_key' => 'wallet']);

    $this->actingAs($u)->postJson("/api/wallets/{$w->id}/card-image", [
        'image' => makeTestImage(400, 400, 'webp'),
    ])->assertOk()->assertJsonPath('has_card_image', true);
});

// ---------------------------------------------------------------------------
// Ekstensi palsu (konten PHP, nama .jpg) → 422
// ---------------------------------------------------------------------------

it('menolak file dengan ekstensi jpg tapi isi PHP (ekstensi palsu)', function () {
    $u = User::factory()->create();
    $w = $u->wallets()->create(['name' => 'Kas', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);

    // Buat file PHP dengan nama .jpg
    $tmp = tempnam(sys_get_temp_dir(), 'fake_').'.jpg';
    file_put_contents($tmp, '<?php echo "exploit"; ?>');
    $fakeFile = new UploadedFile($tmp, 'malicious.jpg', 'image/jpeg', null, true);

    $response = $this->actingAs($u)->postJson("/api/wallets/{$w->id}/card-image", [
        'image' => $fakeFile,
    ]);

    $response->assertStatus(422);

    // Pastikan wallet tidak memiliki foto
    $w->refresh();
    expect($w->card_image_path)->toBeNull();
});

// ---------------------------------------------------------------------------
// File teks dengan ekstensi .png → 422
// ---------------------------------------------------------------------------

it('menolak file teks biasa dengan ekstensi png', function () {
    $u = User::factory()->create();
    $w = $u->wallets()->create(['name' => 'Kas', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);

    $tmp = tempnam(sys_get_temp_dir(), 'txt_').'.png';
    file_put_contents($tmp, 'ini bukan gambar');
    $fakeFile = new UploadedFile($tmp, 'bukan-gambar.png', 'image/png', null, true);

    $this->actingAs($u)->postJson("/api/wallets/{$w->id}/card-image", [
        'image' => $fakeFile,
    ])->assertStatus(422);
});

// ---------------------------------------------------------------------------
// File lebih dari 2MB → 422
// ---------------------------------------------------------------------------

it('menolak file gambar lebih dari 2MB', function () {
    $u = User::factory()->create();
    $w = $u->wallets()->create(['name' => 'Kas', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);

    // Buat file besar (>2MB) dengan nama jpg yang valid secara mime tetapi besar
    // Gunakan UploadedFile::fake()->size() idiom via GD: buat gambar JPEG besar
    // Cara sederhana: buat file teks besar dengan ekstensi jpg dan mime jpeg
    // Ini akan lolos mimes tapi kita ingin test ukuran. Buat via GD image besar.
    // Namun GD bisa kompres, sulit capai 2MB via imagejpeg. Kita buat raw file.
    $tmp = tempnam(sys_get_temp_dir(), 'big_').'.jpg';

    // Tulis JPEG magic bytes dulu, lalu padding besar
    $jpegHeader = "\xFF\xD8\xFF\xE0".str_repeat("\x00", 10); // JFIF header minimal
    $padding = str_repeat('X', 2 * 1024 * 1024 + 1024); // > 2MB
    file_put_contents($tmp, $jpegHeader.$padding);

    $bigFile = new UploadedFile($tmp, 'big.jpg', 'image/jpeg', null, true);

    $this->actingAs($u)->postJson("/api/wallets/{$w->id}/card-image", [
        'image' => $bigFile,
    ])->assertStatus(422);
});

// ---------------------------------------------------------------------------
// Dimensi terlalu kecil (< 300x300) → 422
// ---------------------------------------------------------------------------

it('menolak gambar dengan dimensi kurang dari 300x300', function () {
    $u = User::factory()->create();
    $w = $u->wallets()->create(['name' => 'Kas', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);

    $this->actingAs($u)->postJson("/api/wallets/{$w->id}/card-image", [
        'image' => makeSmallImage(100, 100),
    ])->assertStatus(422)->assertJsonStructure(['errors' => ['image']]);
});

// ---------------------------------------------------------------------------
// Ganti foto: file lama dihapus, file baru ada
// ---------------------------------------------------------------------------

it('upload kedua menggantikan foto lama dan file lama dihapus', function () {
    $u = User::factory()->create();
    $w = $u->wallets()->create(['name' => 'Kas', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);

    // Upload pertama
    $this->actingAs($u)->postJson("/api/wallets/{$w->id}/card-image", [
        'image' => makeTestImage(400, 400, 'jpg'),
    ])->assertOk();

    $w->refresh();
    $firstPath = $w->card_image_path;
    $firstFullPath = storage_path('app/private/'.$firstPath);
    expect(file_exists($firstFullPath))->toBeTrue();

    // Upload kedua
    $this->postJson("/api/wallets/{$w->id}/card-image", [
        'image' => makeTestImage(400, 400, 'png'),
    ])->assertOk();

    $w->refresh();
    $secondPath = $w->card_image_path;

    // Path berubah
    expect($secondPath)->not->toBe($firstPath);

    // File lama sudah tidak ada
    expect(file_exists($firstFullPath))->toBeFalse();

    // File baru ada
    $secondFullPath = storage_path('app/private/'.$secondPath);
    expect(file_exists($secondFullPath))->toBeTrue();
});

// ---------------------------------------------------------------------------
// WalletResource: has_card_image benar
// ---------------------------------------------------------------------------

it('WalletResource mengembalikan has_card_image true setelah upload', function () {
    $u = User::factory()->create();
    $w = $u->wallets()->create(['name' => 'Kas', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);

    // Sebelum upload: false
    $this->actingAs($u)->getJson("/api/wallets/{$w->id}")
        ->assertOk()
        ->assertJsonPath('data.has_card_image', false);

    // Upload
    $this->postJson("/api/wallets/{$w->id}/card-image", [
        'image' => makeTestImage(),
    ])->assertOk();

    // Setelah upload: true
    $this->getJson("/api/wallets/{$w->id}")
        ->assertOk()
        ->assertJsonPath('data.has_card_image', true);
});

// ---------------------------------------------------------------------------
// GET /card-image: stream foto berhasil
// ---------------------------------------------------------------------------

it('GET card-image mengembalikan konten gambar dengan header yang benar', function () {
    $u = User::factory()->create();
    $w = $u->wallets()->create(['name' => 'Kas', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);

    $this->actingAs($u)->postJson("/api/wallets/{$w->id}/card-image", [
        'image' => makeTestImage(),
    ])->assertOk();

    $response = $this->actingAs($u)->get("/api/wallets/{$w->id}/card-image");

    $response->assertOk();
    expect($response->headers->get('Cache-Control'))->toContain('private');
    $response->assertHeader('X-Content-Type-Options', 'nosniff');

    // Content harus ada (bukan kosong)
    expect(strlen($response->getContent()))->toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// GET /card-image: 404 bila belum ada foto
// ---------------------------------------------------------------------------

it('GET card-image mengembalikan 404 bila belum ada foto', function () {
    $u = User::factory()->create();
    $w = $u->wallets()->create(['name' => 'Kas', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);

    $this->actingAs($u)->getJson("/api/wallets/{$w->id}/card-image")->assertNotFound();
});

// ---------------------------------------------------------------------------
// DELETE endpoint: file dihapus, has_card_image false
// ---------------------------------------------------------------------------

it('DELETE card-image menghapus file dari disk dan mengembalikan has_card_image false', function () {
    $u = User::factory()->create();
    $w = $u->wallets()->create(['name' => 'Kas', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);

    // Upload dulu
    $this->actingAs($u)->postJson("/api/wallets/{$w->id}/card-image", [
        'image' => makeTestImage(),
    ])->assertOk();

    $w->refresh();
    $filePath = storage_path('app/private/'.$w->card_image_path);
    expect(file_exists($filePath))->toBeTrue();

    // Hapus
    $this->deleteJson("/api/wallets/{$w->id}/card-image")
        ->assertOk()
        ->assertJsonPath('has_card_image', false);

    // File sudah tidak ada di disk
    expect(file_exists($filePath))->toBeFalse();

    // DB null
    $w->refresh();
    expect($w->card_image_path)->toBeNull();
});

// ---------------------------------------------------------------------------
// DELETE wallet: file foto ikut terhapus
// ---------------------------------------------------------------------------

it('menghapus dompet juga menghapus file foto kartu dari disk', function () {
    $u = User::factory()->create();
    $w = $u->wallets()->create(['name' => 'Kas', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);

    $this->actingAs($u)->postJson("/api/wallets/{$w->id}/card-image", [
        'image' => makeTestImage(),
    ])->assertOk();

    $w->refresh();
    $filePath = storage_path('app/private/'.$w->card_image_path);
    expect(file_exists($filePath))->toBeTrue();

    // Hapus dompet
    $this->deleteJson("/api/wallets/{$w->id}")->assertNoContent();

    // File foto harus ikut terhapus
    expect(file_exists($filePath))->toBeFalse();
});

// ---------------------------------------------------------------------------
// File tersimpan di direktori user yang benar
// ---------------------------------------------------------------------------

it('file foto tersimpan di direktori user yang benar', function () {
    $u = User::factory()->create();
    $w = $u->wallets()->create(['name' => 'Kas', 'type' => 'cash', 'icon_type' => 'preset', 'icon_key' => 'cash']);

    $this->actingAs($u)->postJson("/api/wallets/{$w->id}/card-image", [
        'image' => makeTestImage(),
    ])->assertOk();

    $w->refresh();

    // Path harus mengandung wallet-cards/{userId}/
    expect($w->card_image_path)->toContain("wallet-cards/{$u->id}/");
});
