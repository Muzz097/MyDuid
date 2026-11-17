<?php

namespace App\Http\Requests;

use Illuminate\Validation\Validator;

class UpdateTransactionRequest extends StoreTransactionRequest
{
    public function rules(): array
    {
        return collect(parent::rules())
            ->map(fn (array $r) => array_merge(['sometimes'], $r))
            ->all();
    }

    public function after(): array
    {
        return [function (Validator $v) {
            if ($v->errors()->isNotEmpty()) {
                return;
            }
            $tx = $this->user()->transactions()->findOrFail($this->route('transaction'));
            $type = $this->input('type', $tx->type);
            $catId = $this->input('category_id', $tx->category_id);
            $cat = $this->user()->categories()->find($catId);
            if ($cat && $cat->type !== $type) {
                $v->errors()->add('category_id', 'Jenis kategori tidak sesuai dengan jenis transaksi.');
            }
        }];
    }
}
