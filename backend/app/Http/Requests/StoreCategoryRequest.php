<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCategoryRequest extends FormRequest
{
    public const ICON_KEYS = ['food', 'transport', 'shopping', 'entertainment', 'salary', 'bonus', 'default'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:60',
                Rule::unique('categories')
                    ->where('user_id', $this->user()->id)
                    ->where('type', $this->input('type')),
            ],
            'type' => ['required', Rule::in(['income', 'expense'])],
            'icon_key' => ['sometimes', 'required', Rule::in(self::ICON_KEYS)],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama kategori wajib diisi.',
            'name.max' => 'Nama kategori maksimal 60 karakter.',
            'name.unique' => 'Nama kategori sudah digunakan untuk jenis ini.',
            'type.required' => 'Jenis kategori wajib dipilih.',
            'type.in' => 'Jenis kategori tidak valid.',
            'icon_key.required' => 'Ikon kategori wajib dipilih.',
            'icon_key.in' => 'Ikon kategori tidak tersedia.',
        ];
    }
}
