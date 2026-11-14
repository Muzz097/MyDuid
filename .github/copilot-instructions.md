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
