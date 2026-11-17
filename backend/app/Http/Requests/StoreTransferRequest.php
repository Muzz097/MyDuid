<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $uid = $this->user()->id;
        $own = fn () => Rule::exists('wallets', 'id')->where('user_id', $uid)->where('is_active', true);

        return [
            'source_wallet_id' => ['required', 'integer', $own()],
            'destination_wallet_id' => ['required', 'integer', 'different:source_wallet_id', $own()],
            'amount' => ['required', 'integer', 'min:1', 'max:9000000000000'],
            'transfer_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:'.Carbon::now('Asia/Jakarta')->addDay()->toDateString()],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'source_wallet_id.required' => 'Dompet asal wajib dipilih.',
            'source_wallet_id.exists' => 'Dompet asal tidak valid atau tidak aktif.',
            'destination_wallet_id.required' => 'Dompet tujuan wajib dipilih.',
            'destination_wallet_id.exists' => 'Dompet tujuan tidak valid atau tidak aktif.',
            'destination_wallet_id.different' => 'Dompet asal dan tujuan tidak boleh sama.',
            'amount.integer' => 'Nominal harus bilangan bulat Rupiah.',
            'amount.min' => 'Nominal harus lebih dari 0.',
            'transfer_date.before_or_equal' => 'Tanggal tidak boleh di masa depan.',
        ];
    }
}
