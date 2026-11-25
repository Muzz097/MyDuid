<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreWalletGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:100'],
            'target_amount' => ['required', 'integer', 'min:1', 'max:9000000000000'],
            'deadline'      => ['nullable', 'date_format:Y-m-d', 'after:today'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            /** @var \App\Models\Wallet $wallet */
            $wallet = $this->route('wallet');

            if ($wallet->group !== 'savings') {
                $validator->errors()->add('wallet_id', 'Goal hanya dapat dibuat untuk dompet kelompok Tabungan.');

                return;
            }

            $exists = $this->user()->walletGoals()->where('wallet_id', $wallet->id)->exists();
            if ($exists) {
                $validator->errors()->add('wallet_id', 'Dompet ini sudah memiliki goal. Ubah atau hapus goal yang ada.');
            }
        }];
    }

    public function messages(): array
    {
        return [
            'name.required'          => 'Nama goal wajib diisi.',
            'name.max'               => 'Nama goal maksimal 100 karakter.',
            'target_amount.required' => 'Target tabungan wajib diisi.',
            'target_amount.integer'  => 'Target tabungan harus bilangan bulat Rupiah.',
            'target_amount.min'      => 'Target tabungan harus lebih dari 0.',
            'target_amount.max'      => 'Target tabungan terlalu besar.',
            'deadline.date_format'   => 'Tenggat harus dalam format YYYY-MM-DD.',
            'deadline.after'         => 'Tenggat harus setelah hari ini.',
        ];
    }
}
