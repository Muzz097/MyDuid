<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWalletRequest extends FormRequest
{
    public const ICON_KEYS = ['cash', 'bank', 'ewallet', 'default'];

    public const CARD_THEMES = ['default', 'rose', 'ocean', 'emerald', 'sunset', 'graphite'];

    public const ICON_TYPES = ['preset', 'emoji'];

    public function authorize(): bool
    {
        return true;
    }

    /**
     * Aturan validasi icon_key sesuai jenis ikon (preset atau emoji).
     *
     * @return array<int, mixed>
     */
    public static function iconKeyRules(mixed $iconType, bool $required = false): array
    {
        if ($iconType === 'emoji') {
            return [
                'required',
                'string',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (
                        ! is_string($value)
                        || grapheme_strlen($value) !== 1
                        || preg_match('/\p{Extended_Pictographic}/u', $value) !== 1
                    ) {
                        $fail('Ikon emoji harus berupa tepat 1 karakter emoji.');
                    }
                },
            ];
        }

        return [
            $required ? 'required' : 'nullable',
            Rule::in(self::ICON_KEYS),
        ];
    }

    public function rules(): array
    {
        $iconType = $this->input('icon_type', 'preset');

        return [
            'name' => ['required', 'string', 'max:60'],
            'type' => ['required', Rule::in(['cash', 'bank', 'ewallet'])],
            'group' => ['nullable', Rule::in(['daily', 'savings', 'investment'])],
            'card_theme' => ['nullable', Rule::in(self::CARD_THEMES)],
            'opening_balance' => ['nullable', 'integer', 'min:0', 'max:9000000000000'],
            'icon_type' => ['nullable', Rule::in(self::ICON_TYPES)],
            'icon_key' => self::iconKeyRules($iconType, false),
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama dompet wajib diisi.',
            'name.max' => 'Nama dompet maksimal 60 karakter.',
            'type.required' => 'Jenis dompet wajib dipilih.',
            'type.in' => 'Jenis dompet tidak valid.',
            'group.in' => 'Kelompok dompet tidak valid. Pilih salah satu: sehari-hari, tabungan, atau investasi.',
            'card_theme.required' => 'Tema kartu wajib dipilih.',
            'card_theme.in' => 'Tema kartu tidak tersedia.',
            'opening_balance.integer' => 'Saldo awal harus bilangan bulat Rupiah.',
            'opening_balance.min' => 'Saldo awal tidak boleh negatif.',
            'opening_balance.max' => 'Saldo awal terlalu besar.',
            'icon_type.required' => 'Jenis ikon wajib dipilih.',
            'icon_type.in' => 'Jenis ikon tidak valid.',
            'icon_key.required' => 'Ikon wajib dipilih.',
            'icon_key.in' => 'Ikon tidak tersedia.',
        ];
    }
}
