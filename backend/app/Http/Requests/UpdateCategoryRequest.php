<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $category = $this->user()->categories()->findOrFail($this->route('category'));

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:60',
                Rule::unique('categories')
                    ->where('user_id', $this->user()->id)
                    ->where('type', $category->type)
                    ->ignore($category->id),
            ],
            'type' => ['prohibited'],
            'icon_key' => ['sometimes', 'required', Rule::in(StoreCategoryRequest::ICON_KEYS)],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama kategori wajib diisi.',
            'name.max' => 'Nama kategori maksimal 60 karakter.',
            'name.unique' => 'Nama kategori sudah digunakan untuk jenis ini.',
            'type.prohibited' => 'Jenis kategori tidak dapat diubah.',
            'icon_key.required' => 'Ikon kategori wajib dipilih.',
            'icon_key.in' => 'Ikon kategori tidak tersedia.',
        ];
    }
}
