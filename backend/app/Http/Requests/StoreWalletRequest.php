<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWalletRequest extends FormRequest
{
    public const ICON_KEYS = ['cash', 'bank', 'ewallet', 'default'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:60'],
            'type' => ['required', Rule::in(['cash', 'bank', 'ewallet'])],
            'opening_balance' => ['nullable', 'integer', 'min:0', 'max:9000000000000'],
            'icon_type' => ['nullable', Rule::in(['preset'])], // custom menyusul di fitur upload
            'icon_key' => ['nullable', Rule::in(self::ICON_KEYS)],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama dompet wajib diisi.',
            'name.max' => 'Nama dompet maksimal 60 karakter.',
            'type.required' => 'Jenis dompet wajib dipilih.',
            'type.in' => 'Jenis dompet tidak valid.',
            'opening_balance.integer' => 'Saldo awal harus bilangan bulat Rupiah.',
            'opening_balance.min' => 'Saldo awal tidak boleh negatif.',
            'opening_balance.max' => 'Saldo awal terlalu besar.',
            'icon_key.in' => 'Ikon tidak tersedia.',
        ];
    }
}
