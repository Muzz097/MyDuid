<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ReportPeriodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
        ];
    }

    public function messages(): array
    {
        return [
            'from.required' => 'Tanggal mulai wajib diisi.',
            'from.date_format' => 'Format tanggal mulai harus YYYY-MM-DD.',
            'to.required' => 'Tanggal akhir wajib diisi.',
            'to.date_format' => 'Format tanggal akhir harus YYYY-MM-DD.',
            'to.after_or_equal' => 'Tanggal akhir harus sama atau setelah tanggal mulai.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $from = Carbon::createFromFormat('Y-m-d', (string) $this->query('from'), 'Asia/Jakarta')->startOfDay();
            $to = Carbon::createFromFormat('Y-m-d', (string) $this->query('to'), 'Asia/Jakarta')->startOfDay();

            if ($from->diffInDays($to) > 366) {
                $validator->errors()->add('to', 'Rentang tanggal laporan maksimal 366 hari.');
            }
        });
    }

    public function fromDate(): Carbon
    {
        return Carbon::createFromFormat('Y-m-d', (string) $this->query('from'), 'Asia/Jakarta')->startOfDay();
    }

    public function toDate(): Carbon
    {
        return Carbon::createFromFormat('Y-m-d', (string) $this->query('to'), 'Asia/Jakarta')->startOfDay();
    }
}
