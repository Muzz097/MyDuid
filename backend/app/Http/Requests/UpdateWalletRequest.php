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
        $hasIconType = $this->has('icon_type');
        $iconType = $this->input('icon_type', 'preset');
        $iconKeyRules = StoreWalletRequest::iconKeyRules($iconType, $hasIconType);

        if (! $hasIconType) {
            array_unshift($iconKeyRules, 'sometimes');
        }

        return [
            'name' => ['sometimes', 'required', 'string', 'max:60'],
            'type' => ['sometimes', 'required', Rule::in(['cash', 'bank', 'ewallet'])],
            'group' => ['sometimes', 'required', Rule::in(['daily', 'savings', 'investment'])],
            'card_theme' => ['sometimes', 'required', Rule::in(StoreWalletRequest::CARD_THEMES)],
            'icon_type' => ['sometimes', 'required', Rule::in(StoreWalletRequest::ICON_TYPES)],
            'icon_key' => $iconKeyRules,
        ];
    }

    public function messages(): array
    {
        return (new StoreWalletRequest)->messages();
    }
}
