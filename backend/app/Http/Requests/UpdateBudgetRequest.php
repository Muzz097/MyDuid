<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'limit_amount' => ['sometimes', 'required', 'integer', 'min:1', 'max:9000000000000'],
        ];
    }

    public function messages(): array
    {
        return [
            'limit_amount.required' => 'Batas anggaran wajib diisi.',
            'limit_amount.integer' => 'Batas anggaran harus bilangan bulat Rupiah.',
            'limit_amount.min' => 'Batas anggaran harus lebih dari 0.',
            'limit_amount.max' => 'Batas anggaran terlalu besar.',
        ];
    }
}
