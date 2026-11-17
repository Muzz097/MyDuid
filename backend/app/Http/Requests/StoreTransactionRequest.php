<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $uid = $this->user()->id;
        $maxDate = Carbon::now('Asia/Jakarta')->addDay()->toDateString();

        return [
            'wallet_id' => ['required', 'integer', Rule::exists('wallets', 'id')->where('user_id', $uid)->where('is_active', true)],
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')->where('user_id', $uid)->where('is_active', true)],
            'type' => ['required', Rule::in(['income', 'expense'])],
            'amount' => ['required', 'integer', 'min:1', 'max:9000000000000'],
            'transaction_date' => ['required', 'date_format:Y-m-d', 'before_or_equal:'.$maxDate],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $v) {
            if ($v->errors()->hasAny(['category_id', 'type'])) {
                return;
            }
            $cat = $this->user()->categories()->find($this->input('category_id'));
            if ($cat && $cat->type !== $this->input('type')) {
                $v->errors()->add('category_id', 'Jenis kategori tidak sesuai dengan jenis transaksi.');
            }
        }];
    }

    public function messages(): array
    {
        return [
            'wallet_id.required' => 'Dompet wajib dipilih.',
            'wallet_id.exists' => 'Dompet tidak valid atau tidak aktif.',
            'category_id.required' => 'Kategori wajib dipilih.',
            'category_id.exists' => 'Kategori tidak valid atau tidak aktif.',
            'type.in' => 'Jenis transaksi tidak valid.',
            'amount.integer' => 'Nominal harus bilangan bulat Rupiah.',
            'amount.min' => 'Nominal harus lebih dari 0.',
            'amount.max' => 'Nominal terlalu besar.',
            'transaction_date.date_format' => 'Format tanggal harus YYYY-MM-DD.',
            'transaction_date.before_or_equal' => 'Tanggal tidak boleh di masa depan.',
        ];
    }
}
