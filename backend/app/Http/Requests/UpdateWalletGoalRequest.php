<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWalletGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => ['sometimes', 'required', 'string', 'max:100'],
            'target_amount' => ['sometimes', 'required', 'integer', 'min:1', 'max:9000000000000'],
            'deadline'      => ['sometimes', 'nullable', 'date_format:Y-m-d', 'after:today'],
        ];
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
