<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreBudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'category_id' => ['nullable', 'integer', Rule::exists('categories', 'id')->where('user_id', $userId)->where('is_active', true)],
            'wallet_id' => ['nullable', 'integer', Rule::exists('wallets', 'id')->where('user_id', $userId)->where('is_active', true)],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'limit_amount' => ['required', 'integer', 'min:1', 'max:9000000000000'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $categoryId = $this->input('category_id');
            $walletId = $this->input('wallet_id');

            if ($categoryId === null && $walletId === null) {
                $validator->errors()->add('category_id', 'Pilih kategori, dompet, atau keduanya.');

                return;
            }

            if ($categoryId !== null) {
                $category = $this->user()->categories()->find($categoryId);
                if ($category && $category->type !== 'expense') {
                    $validator->errors()->add('category_id', 'Kategori anggaran harus bertipe pengeluaran.');

                    return;
                }
            }

            $duplicate = $this->user()->budgets()
                ->where('year', $this->input('year'))
                ->where('month', $this->input('month'))
                ->when($categoryId === null, fn ($query) => $query->whereNull('category_id'), fn ($query) => $query->where('category_id', $categoryId))
                ->when($walletId === null, fn ($query) => $query->whereNull('wallet_id'), fn ($query) => $query->where('wallet_id', $walletId))
                ->exists();

            if ($duplicate) {
                $validator->errors()->add('month', 'Anggaran untuk kombinasi ini sudah ada pada bulan tersebut.');
            }
        }];
    }

    public function messages(): array
    {
        return [
            'category_id.exists' => 'Kategori tidak valid atau tidak aktif.',
            'wallet_id.exists' => 'Dompet tidak valid atau tidak aktif.',
            'year.required' => 'Tahun wajib diisi.',
            'year.integer' => 'Tahun harus berupa bilangan bulat.',
            'year.min' => 'Tahun minimal 2000.',
            'year.max' => 'Tahun maksimal 2100.',
            'month.required' => 'Bulan wajib diisi.',
            'month.integer' => 'Bulan harus berupa bilangan bulat.',
            'month.min' => 'Bulan harus antara 1 dan 12.',
            'month.max' => 'Bulan harus antara 1 dan 12.',
            'limit_amount.required' => 'Batas anggaran wajib diisi.',
            'limit_amount.integer' => 'Batas anggaran harus bilangan bulat Rupiah.',
            'limit_amount.min' => 'Batas anggaran harus lebih dari 0.',
            'limit_amount.max' => 'Batas anggaran terlalu besar.',
        ];
    }
}
