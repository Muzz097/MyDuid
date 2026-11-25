<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class WalletCardImageService
{
    private const MAX_SIDE = 1200;

    private const JPEG_QUALITY = 85;

    private const WEBP_QUALITY = 85;

    private const DISK = 'local';

    /**
     * Simpan foto kartu dan kembalikan path relatif.
     * Re-encode via GD, resize max 1200px sisi terpanjang, buang metadata EXIF.
     */
    public function store(UploadedFile $file, int $userId): string
    {
        // Verifikasi konten dengan getimagesize (bukan hanya ekstensi)
        $info = @getimagesize($file->getRealPath());
        if (! $info || ! in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
            throw new RuntimeException('File bukan gambar yang valid (JPEG, PNG, atau WebP).');
        }

        $src = $this->loadGdImage($file->getRealPath(), $info[2]);
        if (! $src) {
            throw new RuntimeException('Gambar tidak dapat dibaca.');
        }

        [$w, $h] = [$info[0], $info[1]];
        [$newW, $newH] = $this->calcResize($w, $h);

        // Buat canvas baru dan resampling
        $dst = imagecreatetruecolor($newW, $newH);

        // Preservasi transparansi untuk PNG
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
        imagefilledrectangle($dst, 0, 0, $newW, $newH, $transparent);
        imagealphablending($dst, true);

        imagecopyresampled($dst, $src, 0, 0, 0, 0, $newW, $newH, $w, $h);
        imagedestroy($src);

        // Encode ke WebP (tidak ada metadata EXIF)
        ob_start();
        if (function_exists('imagewebp')) {
            imagewebp($dst, null, self::WEBP_QUALITY);
            $ext = 'webp';
            $mime = 'image/webp';
        } else {
            imagejpeg($dst, null, self::JPEG_QUALITY);
            $ext = 'jpg';
            $mime = 'image/jpeg';
        }
        $encoded = ob_get_clean();
        imagedestroy($dst);

        $filename = hash('sha256', random_bytes(32)).".$ext";
        $dir = "wallet-cards/{$userId}";
        $path = "{$dir}/{$filename}";

        Storage::disk(self::DISK)->put($path, $encoded);

        return $path;
    }

    /**
     * Hapus file dari disk.
     */
    public function delete(string $path): void
    {
        if (Storage::disk(self::DISK)->exists($path)) {
            Storage::disk(self::DISK)->delete($path);
        }
    }

    /**
     * Dapatkan konten mentah file untuk streaming.
     *
     * @return array{content: string, mime: string}|null
     */
    public function read(string $path): ?array
    {
        if (! Storage::disk(self::DISK)->exists($path)) {
            return null;
        }

        $content = Storage::disk(self::DISK)->get($path);
        $mime = str_ends_with($path, '.webp') ? 'image/webp' : 'image/jpeg';

        return ['content' => $content, 'mime' => $mime];
    }

    /**
     * Hitung dimensi baru mempertahankan rasio, sisi terpanjang max MAX_SIDE.
     *
     * @return array{int, int}
     */
    private function calcResize(int $w, int $h): array
    {
        $max = self::MAX_SIDE;
        if ($w <= $max && $h <= $max) {
            return [$w, $h];
        }

        if ($w >= $h) {
            return [$max, (int) round($h * $max / $w)];
        }

        return [(int) round($w * $max / $h), $max];
    }

    private function loadGdImage(string $path, int $type): mixed
    {
        return match ($type) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($path),
            IMAGETYPE_PNG => @imagecreatefrompng($path),
            IMAGETYPE_WEBP => @imagecreatefromwebp($path),
            default => false,
        };
    }
}
