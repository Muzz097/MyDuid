<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWalletRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:60'],
            'type' => ['sometimes', 'required', Rule::in(['cash', 'bank', 'ewallet'])],
            'icon_key' => ['sometimes', 'required', Rule::in(StoreWalletRequest::ICON_KEYS)],
        ];
    }

    public function messages(): array
    {
        return (new StoreWalletRequest)->messages();
    }
}
