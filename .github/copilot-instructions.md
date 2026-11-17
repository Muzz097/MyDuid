# MyDuid — Aturan Proyek

Aplikasi personal finance (React SPA + Laravel API). Bahasa UI: Indonesia.

## Stack frontend (folder `frontend/`)
React 19, TypeScript strict, Vite, Tailwind CSS 4, Recharts, react-router-dom, lucide-react.

## Aturan wajib
- Import memakai alias `@/` (contoh: `@/components/ui/Button`).
- Gunakan `cn()` dari `@/lib/cn` untuk class kondisional.
- Uang = integer Rupiah. Format hanya lewat `@/lib/money`. DILARANG memakai float untuk uang.
- Warna HANYA dari token di `src/index.css`: `bg-brand-*` (aksi/brand), `text-income-*` (pemasukan), `text-expense-*` (pengeluaran), `warn`/`danger` (status anggaran), `bg-page`, `bg-card`, `text-ink`, `text-ink-soft`, `border-line`.
- Dilarang hardcode hex atau memakai slate/gray/pink bawaan Tailwind.
- Pengeluaran BUKAN pink (pink = brand). Pengeluaran = coral (`expense`).
- Status tidak boleh hanya warna: selalu sertakan ikon atau teks.
- Angka uang pakai class `tabular`.
- Mobile-first. Target sentuh minimal 44px. Dukung dark mode lewat token, bukan `dark:` manual kecuali perlu.
- Nada teks netral dan tidak menghakimi (jangan "kamu boros").
- Komponen: function component, props bertipe eksplisit, satu komponen per file, export named.
- Jangan tambah dependensi baru tanpa diminta.
- Data sementara dari `src/mocks/`, belum ada API.

## Struktur
components/ui (generik), components/layout, features/<modul>, pages, lib, hooks, types, mocks.

## Ikon & gerak
- Ikon HANYA dari `lucide-react` (outline, strokeWidth 1.75). DILARANG emoji
  di UI, data, maupun teks. Ikon dipetakan lewat `@/lib/icons` (getIcon).
- Data menyimpan `iconKey` (string), bukan emoji.
- Animasi memakai CSS/Tailwind (`animate-fade-up`, transition). Tanpa library
  animasi baru. Semua gerak wajib menghormati `prefers-reduced-motion`.
- Durasi transisi 150–300ms, easing halus. Elemen interaktif punya state
  hover, active (scale-[0.98]), dan focus-visible ring yang jelas.

  ## Backend (folder `backend/`)
Laravel 13, PHP 8.4, PostgreSQL 16, Sanctum SPA (session cookie, TANPA bearer token), Pest.
Komentar & pesan error API: Bahasa Indonesia. Kode & nama class: Inggris.

### Aturan wajib
- Uang = integer Rupiah (bigInteger). DILARANG float/decimal untuk uang.
- Saldo HANYA dihitung lewat `App\Services\BalanceService`. Jangan hitung ulang di tempat lain.
- Isolasi data: SELALU ambil data lewat relasi user (`$request->user()->wallets()`), tidak pernah `Wallet::find()`.
- `user_id` DILARANG masuk `$fillable` dan DILARANG dari input request.
- Setiap controller resource memakai Policy (`$this->authorize`) DAN ownership query.
- Validasi: Form Request. wallet_id/category_id divalidasi dengan `Rule::exists(...)->where('user_id', $request->user()->id)`.
- Kategori income hanya untuk transaksi income, expense untuk expense (validasi).
- Operasi multi-tabel (transfer) WAJIB `DB::transaction`.
- Response: API Resource. Jangan return model mentah.
- JANGAN ubah migration yang sudah ada. Perubahan skema = migration baru.
- Jangan tambah paket Composer tanpa diminta.
- Selesai tiap tugas: `./vendor/bin/pint` lalu `./vendor/bin/pest`. Jangan klaim selesai jika pest merah.
- Satu tugas per sesi. Jangan mengerjakan hal di luar daftar.

## Budget
- Budget per bulan: kolom year, month, limit_amount, category_id nullable, wallet_id nullable; minimal salah satu terisi (CHECK sudah ada di DB).
- category_id dan wallet_id divalidasi Rule::exists berfilter user dan is_active.
- Kategori budget harus bertipe expense.
- Unik per user+year+month+category_id+wallet_id (cek di Form Request, perlakukan NULL sebagai nilai).
- Progres (spent) = SUM transaksi expense aktif (deleted_at NULL) pada bulan itu, difilter category_id dan/atau wallet_id budget. Satu transaksi tidak boleh terhitung dua kali dalam satu budget. Transfer TIDAK dihitung.
- Status: <80% healthy, 80-100% warning, >100% over.
- Logika spent di App\Services\BudgetProgressService, bukan di controller.