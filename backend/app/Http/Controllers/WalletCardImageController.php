<?php

namespace App\Http\Controllers;

use App\Services\WalletCardImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;

class WalletCardImageController extends Controller
{
    public function __construct(private WalletCardImageService $imageService) {}

    /**
     * Upload atau ganti foto kartu dompet.
     */
    public function store(Request $request, string $wallet): JsonResponse
    {
        $model = $request->user()->wallets()->findOrFail($wallet);
        $this->authorize('update', $model);

        $validator = Validator::make($request->all(), [
            'image' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! ($value instanceof UploadedFile)) {
                        return;
                    }

                    $info = @getimagesize($value->getRealPath());
                    if (! $info || ! in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
                        $fail('File bukan gambar yang valid. Pastikan isinya JPEG, PNG, atau WebP.');

                        return;
                    }

                    if ($info[0] < 300 || $info[1] < 300) {
                        $fail('Dimensi gambar minimal 300×300 piksel.');
                    }
                },
            ],
        ], [
            'image.required' => 'Foto kartu wajib disertakan.',
            'image.file' => 'Upload harus berupa file.',
            'image.mimes' => 'Format yang didukung: JPG, PNG, dan WebP.',
            'image.max' => 'Ukuran foto maksimal 2 MB.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Data tidak valid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Hapus file lama bila ada
            if ($model->card_image_path) {
                $this->imageService->delete($model->card_image_path);
            }

            $path = $this->imageService->store($request->file('image'), $request->user()->id);
            $model->update(['card_image_path' => $path]);

            return response()->json(['message' => 'Foto kartu berhasil diunggah.', 'has_card_image' => true], 200);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Stream foto kartu ke pemilik yang sah.
     */
    public function show(Request $request, string $wallet): Response|JsonResponse
    {
        $model = $request->user()->wallets()->findOrFail($wallet);
        $this->authorize('view', $model);

        if (! $model->card_image_path) {
            return response()->json(['message' => 'Foto kartu tidak ditemukan.'], 404);
        }

        $file = $this->imageService->read($model->card_image_path);
        if (! $file) {
            return response()->json(['message' => 'Foto kartu tidak ditemukan.'], 404);
        }

        return response($file['content'], 200, [
            'Content-Type' => $file['mime'],
            'Cache-Control' => 'private, max-age=3600',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /**
     * Hapus foto kartu.
     */
    public function destroy(Request $request, string $wallet): JsonResponse
    {
        $model = $request->user()->wallets()->findOrFail($wallet);
        $this->authorize('update', $model);

        if ($model->card_image_path) {
            $this->imageService->delete($model->card_image_path);
            $model->update(['card_image_path' => null]);
        }

        return response()->json(['message' => 'Foto kartu dihapus.', 'has_card_image' => false]);
    }
}
