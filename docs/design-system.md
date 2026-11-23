
# MyDuid Design System
## Your Money, Understood.

**Version:** 1.0  
**Status:** Approved Product Design Direction  
**Primary language:** Indonesian  
**Platform:** Responsive Web Application / PWA-ready  
**Design approach:** Friendly, modern, financial clarity, warm, trustworthy.

Dokumen ini adalah pedoman visual dan pengalaman pengguna MyDuid. Semua AI coding agents, frontend developers, dan contributors wajib menggunakannya sebagai referensi saat membangun atau memperbarui antarmuka.

Dokumen ini melengkapi `AGENTS.md`, bukan menggantikan aturan arsitektur, keamanan, dan implementasi yang ada di sana.

---

# 1. Product Identity

## 1.1 Product Positioning

**MyDuid — Your Money, Understood.**

MyDuid adalah pendamping keuangan pribadi yang membantu pengguna mencatat, memahami, merencanakan, dan mengelola kondisi keuangannya dalam satu aplikasi.

MyDuid bukan sekadar aplikasi pencatatan pemasukan dan pengeluaran. Produk harus membantu pengguna merasa lebih memahami uangnya dan lebih percaya diri ketika mengambil keputusan finansial.

## 1.2 Four Product Pillars

### Fast Input
Mencatat transaksi dengan cepat dan mudah melalui:
- Input manual.
- Smart Receipt Scanner.
- Voice Transaction.
- Asisten AI.
- Kanal eksternal seperti WhatsApp setelah kelayakan kebijakan dan teknis dipastikan.

Semua metode input harus menggunakan sistem transaksi yang sama. Jangan membuat database atau sistem transaksi terpisah untuk setiap metode input.

### Smart Understanding
Membantu pengguna memahami kondisi keuangan:
- Ringkasan keuangan.
- Analisis pengeluaran.
- Perbandingan periode.
- Insight otomatis.
- Tanya jawab berbasis data keuangan pengguna.

### Financial Planning
Membantu pengguna membuat keputusan:
- Anggaran.
- Target tabungan.
- Simulasi sebelum membeli.
- Aset dan kewajiban.
- Laporan keuangan.
- Ringkasan bulanan.

### Friendly Experience
Aplikasi harus terasa:
- Hangat.
- Mudah dipahami pemula.
- Modern.
- Tidak menghakimi.
- Responsif.
- Konsisten.
- Menyenangkan tanpa menjadi kekanak-kanakan.

---

# 2. Brand Personality

## 2.1 Visual Personality

MyDuid harus memiliki karakter:

| Karakter | Penerapan |
|---|---|
| Friendly | Sudut kartu lembut, sapaan hangat, bahasa sederhana |
| Trustworthy | Angka jelas, informasi transparan, status yang mudah dipahami |
| Modern | Layout bersih, typography rapi, grafik sederhana |
| Approachable | Tidak terlalu formal atau penuh istilah finansial |
| Intelligent | Insight dan rekomendasi berbasis data aktual |
| Playful | Maskot dan microinteraction secara proporsional |

## 2.2 Design Principles

1. Clarity over decoration: informasi keuangan lebih penting daripada ornamen.
2. Function before animation: animasi harus menjelaskan respons aplikasi.
3. Consistency over novelty: komponen yang sama harus berperilaku sama.
4. Mobile-first: pengalaman mobile bukan versi desktop yang diperkecil.
5. Progressive disclosure: fitur kompleks ditampilkan saat benar-benar diperlukan.
6. No misleading information: jangan menampilkan nominal, status, atau insight yang belum terverifikasi.
7. User control: pengguna tetap memegang kendali atas transaksi dan perubahan data.
8. Privacy by design: informasi keuangan sensitif ditampilkan secara hati-hati.

---

# 3. Color System

## 3.1 Default Theme — Rupiah Merah

Tema default MyDuid diberi nama **Rupiah Merah**.

Inspirasi visual berasal dari nuansa hangat merah, rose, dan kemerahan uang kertas Rupiah Rp100.000. Ini merupakan interpretasi visual, bukan reproduksi desain resmi uang kertas.

Karakter:
- Warm red.
- Soft coral.
- Cream.
- Burgundy.
- Emerald green untuk pemasukan.
- White surface.

Tema ini harus terlihat elegan, hangat, dan profesional. Jangan membuat keseluruhan aplikasi berwarna merah menyala.

### Rupiah Merah palette

| Token | Hex | Penggunaan |
|---|---|---|
| Brand 50 | `#FFF1F2` | Background aksen sangat lembut |
| Brand 100 | `#FFE2E5` | Hover surface |
| Brand 200 | `#FFC7CD` | Border aksen |
| Brand 300 | `#F59AA4` | Decorative accent |
| Brand 400 | `#E76D7B` | Secondary brand |
| Brand 500 | `#C43D4B` | Primary action |
| Brand 600 | `#A92D3D` | Hover primary |
| Brand 700 | `#882434` | Active primary |
| Brand 800 | `#6D1C29` | Strong emphasis |
| Brand 900 | `#4F1722` | Deep burgundy |

### Rupiah Merah surface palette

| Token | Hex | Penggunaan |
|---|---|---|
| Page | `#FFF8F5` | Main application background |
| Card | `#FFFFFF` | Cards, panels, dialogs |
| Muted | `#F8EBE9` | Secondary surfaces |
| Border | `#EED9D8` | Card and input borders |
| Text Primary | `#3C2026` | Main text |
| Text Secondary | `#7B6266` | Supporting text |

Brand color digunakan untuk primary actions, active navigation, focus accents, dan elemen identitas.

Jangan menggunakan brand color untuk mengartikan pemasukan atau pengeluaran.

## 3.2 Alternative Theme — MyDuid Garden

Tema ini mempertahankan identitas pink dan botanical green MyDuid sebelumnya.

| Token | Hex |
|---|---|
| Brand Primary | `#B9326D` |
| Brand Dark | `#8F2453` |
| Garden Pink | `#E7A4BB` |
| Leaf Green | `#6F9875` |
| Page | `#FFF7FA` |
| Surface | `#FFFFFF` |
| Muted | `#F9EDF2` |
| Border | `#EEDBE4` |
| Text Primary | `#30212A` |
| Text Secondary | `#786673` |

Karakter: friendly, soft, botanical, dan romantic.

Gunakan green sebagai accent pendukung. Jangan membuat warna pink dan green saling bersaing.

## 3.3 Alternative Theme — Emerald

| Token | Hex |
|---|---|
| Brand Primary | `#176B50` |
| Brand Dark | `#10513D` |
| Brand Soft | `#DCEFE5` |
| Accent | `#D5AE62` |
| Page | `#F5FAF7` |
| Surface | `#FFFFFF` |
| Muted | `#EAF3EE` |
| Border | `#D6E7DD` |
| Text Primary | `#1E332A` |
| Text Secondary | `#65786E` |

Karakter: fresh, natural, professional, dan calm.

## 3.4 Alternative Theme — Midnight Rose

Tema dark utama MyDuid.

| Token | Hex |
|---|---|
| Brand Primary | `#D95C88` |
| Brand Dark | `#B83D69` |
| Brand Soft | `#482638` |
| Page | `#171016` |
| Surface | `#211922` |
| Elevated Surface | `#2C202B` |
| Border | `#443240` |
| Text Primary | `#F7EDF2` |
| Text Secondary | `#BBAAB5` |

Karakter: premium, calm, dark, dan nyaman digunakan dalam kondisi minim cahaya.

Hindari pure black (#000000) sebagai background utama.

## 3.5 Semantic Colors

Warna semantik mempertahankan maknanya di seluruh tema.

### Income

| Token | Hex |
|---|---|
| Income 50 | `#EAF8F0` |
| Income 100 | `#D2F1DE` |
| Income 500 | `#168653` |
| Income 600 | `#117449` |
| Income 700 | `#0D5B3A` |

Gunakan untuk:
- Pemasukan.
- Arus kas positif.
- Keberhasilan penyimpanan.
- Progres yang positif.

### Expense

| Token | Hex |
|---|---|
| Expense 50 | `#FFF1EC` |
| Expense 100 | `#FFE0D4` |
| Expense 400 | `#E47A5C` |
| Expense 500 | `#BF5237` |
| Expense 600 | `#A4402C` |

Gunakan untuk:
- Pengeluaran.
- Arus kas negatif.
- Informasi nilai uang keluar.

Expense menggunakan coral, bukan brand pink dan bukan warna income.

### Warning

| Token | Hex |
|---|---|
| Warn 100 | `#FFF3C4` |
| Warn 500 | `#B77909` |
| Warn 700 | `#805300` |

Gunakan untuk:
- Anggaran mendekati batas.
- Perhatian yang tidak bersifat kritis.

### Danger

| Token | Hex |
|---|---|
| Danger 100 | `#FDE5E5` |
| Danger 500 | `#C93636` |
| Danger 700 | `#972626` |

Gunakan untuk:
- Penghapusan.
- Kesalahan kritis.
- Kondisi yang membutuhkan perhatian segera.

### Information

Gunakan warna biru yang cukup kontras untuk pesan informasional. Gunakan token semantik, bukan hex yang ditulis langsung di komponen.

## 3.6 Color Usage Rules

- Brand bukan income.
- Brand bukan expense.
- Income selalu bermakna uang masuk.
- Expense selalu bermakna uang keluar.
- Warning dan danger tidak boleh tertukar.
- Jangan menggunakan warna saja untuk menyampaikan status.
- Selalu tambahkan label, ikon, atau keterangan.
- Jangan menggunakan hardcoded hex pada halaman atau komponen UI.
- Jangan menggunakan warna Tailwind bawaan seperti `slate-*`, `gray-*`, atau `pink-*` untuk menggantikan token proyek.
- Semua perubahan warna tema harus berasal dari design tokens.

---

# 4. Typography

## 4.1 Font Family

Primary font:

**Plus Jakarta Sans**

Gunakan font yang sudah dikonfigurasi dalam proyek.

Fallback:
- ui-sans-serif
- system-ui
- sans-serif

Jangan menambahkan font library baru tanpa persetujuan.

## 4.2 Type Scale

| Role | Size | Weight | Penggunaan |
|---|---:|---:|---|
| Display | 36px | 700 | Hero utama |
| H1 | 30px | 700 | Judul halaman utama |
| H2 | 24px | 700 | Section title |
| H3 | 20px | 600 | Card section |
| H4 | 18px | 600 | Subsection |
| Body Large | 16px | 400 | Deskripsi utama |
| Body | 14px | 400 | Konten umum |
| Body Small | 13px | 400 | Supporting text |
| Caption | 12px | 400 | Metadata |
| Label | 12px | 600 | Form label |

## 4.3 Typography Rules

- Judul harus memiliki hierarki yang jelas.
- Jangan membuat semua teks menjadi bold.
- Gunakan ukuran yang mudah dibaca di mobile.
- Supporting text harus tetap terbaca.
- Jangan membuat label penting terlalu kecil.
- Gunakan `font-variant-numeric: tabular-nums` untuk nominal dan angka yang perlu disejajarkan.

## 4.4 Money Typography

Nominal uang adalah salah satu informasi terpenting MyDuid.

Aturan:
- Nominal saldo utama memiliki hierarki visual tertinggi.
- Format Rupiah melalui utility proyek.
- Gunakan angka tabular.
- Jangan gunakan floating point untuk perhitungan uang.
- Nominal negatif dan positif harus memiliki tanda atau konteks yang jelas.
- Gunakan semantic income/expense colors sesuai konteks.
- Jangan menggunakan font decorative untuk nominal finansial.

---

# 5. Spacing and Layout

## 5.1 Spacing Scale

Gunakan kelipatan 4px.

| Token | Value |
|---|---:|
| 1 | 4px |
| 2 | 8px |
| 3 | 12px |
| 4 | 16px |
| 5 | 20px |
| 6 | 24px |
| 8 | 32px |
| 10 | 40px |
| 12 | 48px |
| 16 | 64px |

## 5.2 Layout Principles

- Mobile-first.
- Jangan mengunci seluruh konten desktop pada lebar yang terlalu sempit.
- Gunakan ruang desktop secara proporsional.
- Gunakan grid yang fleksibel.
- Jangan membuat semua kartu memiliki tinggi yang sama jika informasi tidak membutuhkan.
- Konsisten dalam horizontal alignment.
- Hindari empty space yang tidak memiliki tujuan.
- Jangan membuat dashboard terlalu padat.

## 5.3 Responsive Behavior

### Mobile: under 640px
- Satu kolom untuk sebagian besar konten.
- Bottom navigation.
- Form menggunakan full-width bila sesuai.
- Action sheet dari bawah.
- Card padding lebih ringkas.
- Informasi penting terlihat tanpa harus melakukan scroll horizontal.

### Tablet: 640px–1023px
- Grid dua kolom bila sesuai.
- Sidebar dapat disembunyikan atau menggunakan drawer.
- Jaga ukuran teks dan kartu tetap nyaman.

### Desktop: 1024px and above
- Sidebar permanen.
- Main content memanfaatkan area yang tersedia.
- Dashboard dapat memakai multi-column grid.
- Jangan membatasi halaman terlalu sempit.
- Tabel dapat menggunakan ruang layar lebih luas.

### Wide Desktop: 1280px and above
- Berikan ruang pada dashboard untuk beberapa panel.
- Tetap gunakan maximum content width yang nyaman.
- Jangan membentangkan teks panjang terlalu lebar.

---

# 6. Radius, Border, and Shadow

## 6.1 Border Radius

| Element | Radius |
|---|---|
| Small Badge | 8px |
| Input | 12px |
| Button | 14px |
| Card | 20px |
| Large Panel | 24px |
| Modal | 24px |
| Avatar | 9999px |
| Icon Container | 12px |

Pertahankan token radius yang sudah digunakan proyek selama tidak ada alasan teknis untuk mengubahnya.

## 6.2 Border

- Gunakan border tipis dan lembut.
- Border harus terlihat pada light maupun dark mode.
- Jangan menggunakan border terlalu tebal pada setiap komponen.
- Gunakan border untuk memisahkan informasi yang membutuhkan struktur.

## 6.3 Shadow

- Gunakan shadow ringan untuk kartu.
- Shadow lebih kuat hanya pada popover, dropdown, modal, dan elemen yang elevated.
- Hindari shadow hitam yang terlalu kontras.
- Shadow harus konsisten dengan tema aktif.

---

# 7. Iconography and Illustration

## 7.1 Icons

Gunakan `lucide-react` yang sudah tersedia.

Aturan:
- Outline icon.
- Stroke width sekitar 1.75.
- Konsisten dalam ukuran dan alignment.
- Jangan mencampur ikon dari banyak library.
- Jangan menggunakan emoji dalam UI.
- Reuse icon mapping yang sudah tersedia di `@/lib/icons`.
- Gunakan ikon yang mudah dipahami.

Rekomendasi ukuran:
- 16px: inline metadata.
- 18px: compact control.
- 20px: standard navigation.
- 24px: prominent action.
- 28px–32px: large action.

## 7.2 Mascot

Maskot MyDuid menjadi identitas visual yang ramah.

Peran:
- Menyambut pengguna baru.
- Membantu onboarding.
- Menjelaskan empty states.
- Memberikan petunjuk fitur.
- Menyampaikan insight secara sederhana.

Aturan:
- Jangan tampilkan maskot di setiap card.
- Jangan menghalangi informasi keuangan.
- Jangan menggunakan ilustrasi berlebihan.
- Maskot harus menjadi pendamping, bukan pusat perhatian di setiap halaman.

Visual maskot harus konsisten dan mudah dikenali.

---

# 8. Component Design System

Sebelum membuat komponen baru, periksa komponen yang sudah tersedia dalam proyek.

Gunakan atau kembangkan komponen yang sudah ada daripada membuat implementasi duplikat.

## 8.1 Buttons

Jenis tombol:
- Primary.
- Secondary.
- Ghost.
- Destructive.
- Icon button.

Keadaan:
- Default.
- Hover.
- Active.
- Focus.
- Disabled.
- Loading.
- Success feedback melalui notifikasi atau status terpisah.

Aturan:
- Target sentuh minimal 44px.
- Gunakan label yang jelas.
- Hindari tombol tanpa tujuan.
- Tombol loading tidak boleh mengirim request berulang.
- Tombol berbahaya membutuhkan konfirmasi sesuai konteks.

## 8.2 Cards

Jenis:
- Summary card.
- Balance card.
- Wallet card.
- Budget card.
- Insight card.
- Transaction card.
- AI suggestion card.

Aturan:
- Konten memiliki hierarki jelas.
- Jangan membuat seluruh card clickable bila hanya satu tindakan yang tersedia.
- Interaksi keyboard harus didukung untuk elemen clickable.
- Card tidak harus memiliki shadow besar.
- Hindari informasi berulang.

## 8.3 Forms

- Label selalu jelas.
- Placeholder bukan pengganti label.
- Error tampil dekat dengan field yang bermasalah.
- Form tidak kehilangan data pengguna akibat error.
- Nominal memakai komponen input uang yang sudah tersedia.
- Pilihan dompet dan kategori harus berasal dari data akun pengguna.
- Tombol submit menunjukkan state loading.
- Tampilkan konfirmasi ketika perubahan berhasil.

## 8.4 Dialog and Sheet

Gunakan untuk:
- Konfirmasi penghapusan.
- Form tambah/edit.
- Konfirmasi transaksi.
- Pilihan tindakan.
- Pengaturan tema.

Aturan:
- Fokus keyboard tidak boleh hilang.
- Bisa ditutup dengan cara yang konsisten.
- Memiliki title dan deskripsi yang jelas.
- Mobile menggunakan sheet atau dialog yang sesuai.
- Jangan membuka dialog berlapis tanpa alasan kuat.

## 8.5 Toast and Notification

Jenis:
- Success.
- Error.
- Warning.
- Information.

Aturan:
- Pesan singkat dan jelas.
- Jangan hanya mengandalkan warna.
- Jangan menampilkan pesan berhasil sebelum backend mengonfirmasi.
- Error harus memberikan tindakan lanjutan bila relevan.

## 8.6 Data Table and Lists

- Mudah dipindai.
- Nominal rata kanan.
- Tanggal dan metadata memiliki hierarki.
- Pengelompokan per tanggal dapat digunakan.
- Mobile boleh menggunakan compact list atau transaction cards.
- Jangan memaksakan tabel lebar pada layar kecil.

## 8.7 Skeleton and Empty State

Skeleton:
- Menyerupai struktur konten yang sedang dimuat.
- Tidak terlalu banyak animasi.
- Hindari layout shift yang berlebihan.

Empty state:
- Menjelaskan mengapa data kosong.
- Menunjukkan tindakan berikutnya.
- Menggunakan ilustrasi secukupnya.
- Jangan hanya menampilkan ruang kosong dan tulisan "Tidak ada data".

---

# 9. Navigation and Application Structure

## 9.1 Mobile Navigation

Navigasi utama mobile terdiri dari lima item:

1. Beranda.
2. Transaksi.
3. Tombol tengah Catat (+).
4. Laporan.
5. Asisten.

Dompet tetap dapat diakses melalui Beranda dan navigasi sekunder.

Tombol Catat membuka action sheet dengan:
- Pengeluaran.
- Pemasukan.
- Transfer.
- Foto struk.
- Suara.
- Input cepat.

Fitur yang belum tersedia tidak boleh ditampilkan seolah sudah berfungsi. Gunakan status coming soon hanya jika memang ada alasan produk untuk menampilkannya.

## 9.2 Desktop Navigation

Kelompok sidebar:

### Ringkasan
- Beranda.

### Kelola Keuangan
- Transaksi.
- Dompet.
- Anggaran.
- Kategori.

### Analisis
- Laporan.
- Kalender keuangan.

### Perencanaan
- Target tabungan.
- Aset dan utang.
- Transaksi berulang.

### Asisten
- MyDuid AI.

### Akun
- Profil.
- Preferensi.
- Keamanan.
- Privasi.
- Bantuan.
- Keluar.

Jangan membuat menu yang tidak memiliki halaman atau tujuan nyata.

---

# 10. Theme System

## 10.1 Theme Presets

Tema yang direncanakan:

1. Rupiah Merah — default.
2. MyDuid Garden.
3. Emerald.
4. Midnight Rose — palet rose dengan dukungan light dan dark appearance.

Ocean Blue dan Monochrome dapat dipertimbangkan pada versi selanjutnya.

## 10.2 Appearance Modes

Pilihan mode tampilan:
- Light.
- Dark.
- System.

Tema memilih palet warna; appearance memilih permukaan terang atau gelap.
Keduanya dapat diubah secara independen.

Jika pengguna memilih System, tampilan mengikuti preferensi sistem operasi.

## 10.3 Theme Switcher Interaction

Tombol Appearance/Tampilan tersedia di area header.

Saat dibuka:
- Desktop menggunakan dropdown/popover panel.
- Mobile menggunakan bottom sheet.
- Header tetap berada pada layer yang lebih tinggi dan tidak tertutup panel.
- Tampilkan preview setiap tema.
- Tunjukkan tema aktif dengan indikator yang jelas.
- Perubahan preview terasa lembut.
- Pengguna bisa membatalkan atau menerapkan perubahan sesuai desain interaksi.

Preferensi tema sebaiknya tersimpan pada akun agar konsisten ketika pengguna berpindah perangkat. Untuk pengguna tamu atau sebelum autentikasi, boleh menggunakan preferensi lokal yang aman.

Implementasi awal menyimpan tema dan appearance secara lokal di browser agar tetap konsisten saat route berubah maupun setelah login/logout. Preferensi akun lintas perangkat belum disinkronkan.

Jangan menyimpan token autentikasi di localStorage atau sessionStorage demi fitur tema.

## 10.4 Theme Implementation Rules

- Gunakan centralized CSS design tokens.
- Gunakan semantic CSS variables.
- Jangan mengubah warna satu per satu di setiap halaman.
- Jangan membuat komponen bergantung pada nama tema tertentu.
- Komponen harus tetap bekerja pada seluruh tema.
- Hindari flash of incorrect theme saat aplikasi dimuat.
- Theme preference tidak boleh memengaruhi data transaksi.

---

# 11. Microinteraction and Motion

Microinteraction adalah bagian dari kualitas pengalaman MyDuid.

Gerakan harus membantu pengguna memahami keadaan sistem.

## 11.1 Motion Principles

- Subtle.
- Fast.
- Consistent.
- Purposeful.
- Non-blocking.
- Accessible.

## 11.2 Timing

| Interaction | Duration |
|---|---:|
| Hover | 150ms |
| Button press | 100–150ms |
| Input focus | 150ms |
| Dropdown | 180–220ms |
| Modal | 200–250ms |
| Navigation indicator | 180–220ms |
| Theme transition | 200–300ms |

Gunakan easing yang konsisten, misalnya cubic-bezier(0.22, 1, 0.36, 1).

## 11.3 Button Interaction

- Hover memberi feedback ringan.
- Active boleh menggunakan scale sekitar 0.98.
- Focus-visible ring harus terlihat.
- Loading harus jelas.
- Disabled harus memiliki perbedaan visual.
- Jangan membuat animasi yang menunda fungsi tombol.

## 11.4 Navigation Interaction

- Active indicator bergerak halus.
- Label dan ikon tetap terlihat jelas.
- Jangan menambahkan animasi berlebihan.
- Pastikan route aktif dapat dikenali melalui teks dan visual.

## 11.5 Financial Interaction

Saat transaksi disimpan:
1. Tampilkan loading.
2. Kirim request.
3. Tunggu respons server.
4. Jika berhasil, refresh data dan tampilkan success feedback.
5. Jika gagal, tampilkan error yang jelas.
6. Jangan menganggap saldo berubah sebelum server mengonfirmasi.

## 11.6 Budget Interaction

- Progress bar tampil setelah data termuat.
- Gunakan state healthy, warning, dan over.
- Sertakan persentase dan nominal.
- Empty state memberikan arahan membuat anggaran.

## 11.7 Charts Interaction

- Animasi masuk singkat.
- Tooltip mudah dibaca.
- Transisi data tidak menyesatkan.
- Pengguna harus tetap dapat memahami grafik tanpa mengandalkan animasi.

## 11.8 Reduced Motion

Wajib menghormati:
`prefers-reduced-motion: reduce`

Jika pengguna memilih reduced motion:
- Hilangkan gerakan dekoratif yang tidak diperlukan.
- Kurangi transisi kompleks.
- Jangan mengorbankan feedback fungsional.

Gunakan CSS dan kemampuan native yang sudah ada. Jangan menambahkan animation library baru tanpa persetujuan.

---

# 12. Financial Data Visualization

## 12.1 Data Hierarchy

Informasi keuangan harus memprioritaskan:

1. Total saldo.
2. Pemasukan.
3. Pengeluaran.
4. Arus kas bersih.
5. Anggaran.
6. Tren.
7. Detail kategori.
8. Insight.

Jangan memenuhi dashboard dengan terlalu banyak grafik.

## 12.2 Chart Rules

- Gunakan Recharts yang sudah terpasang.
- Gunakan semantic colors.
- Hindari penggunaan banyak warna tanpa alasan.
- Gunakan label, tooltip, dan legend yang jelas.
- Chart harus responsive.
- Empty state harus disediakan.
- Jangan menggambarkan data kosong sebagai nol jika data gagal dimuat.
- Jangan membuat persentase atau agregasi sendiri jika backend menyediakan nilai otoritatif.

## 12.3 Money Display

- Gunakan format Rupiah konsisten.
- Gunakan utility yang sudah ada pada `@/lib/money`.
- Jangan melakukan kalkulasi uang menggunakan float.
- Gunakan tabular numerals.
- Sembunyikan saldo sesuai preferensi pengguna.
- Jangan membocorkan nominal sensitif pada tooltip yang tidak seharusnya menampilkan data.

---

# 13. Page Experience Guidelines

## 13.1 Dashboard — Financial Command Center

Dashboard harus memudahkan pengguna mengetahui kondisi keuangan saat ini.

Elemen yang direncanakan:
- Personal greeting.
- Total balance.
- Income and expense summary.
- Net cash flow.
- Estimated daily spending limit.
- Cash flow chart.
- Budget progress.
- Wallet overview.
- Recent transactions.
- Financial insights.
- Upcoming recurring obligations.

Jangan membuat seluruh bagian tampil sekaligus dengan bobot visual yang sama.

## 13.2 Transactions

- Summary periode.
- Search.
- Advanced filters.
- Date grouping.
- Category and wallet information.
- Transaction detail.
- Edit/delete.
- Recurring transaction.
- Split transaction.
- Duplicate warning.

## 13.3 Wallets

- Total balance.
- Wallet cards.
- Wallet types.
- Wallet details.
- Transaction history.
- Transfer history.
- Category spending.
- Reconciliation.
- Archive and edit actions.

## 13.4 Budgets

- Overall budget.
- Category budgets.
- Wallet-specific budgets.
- Spent and remaining values.
- Progress.
- Alerts.
- Period comparison.
- Forecast based on actual historical activity.

Forecast must be presented as an estimate, not certainty.

## 13.5 Reports

- Overview.
- Category analysis.
- Spending trends.
- Wallet analysis.
- Period comparison.
- CSV/PDF export.

## 13.6 MyDuid AI

- Conversation interface.
- Suggested questions.
- Financial insights.
- Verified calculation results.
- Draft actions.
- User-confirmed financial changes.
- Link to source transactions when appropriate.

AI must not invent financial data or receive unrestricted database access.

## 13.7 Smart Receipt Scanner

- Camera/upload entry.
- Processing indicator.
- OCR extraction result.
- Editable transaction preview.
- Category and wallet suggestions.
- Duplicate check.
- User confirmation before saving.

## 13.8 Voice Transaction

- Clear microphone state.
- Recording feedback.
- Transcription result.
- Structured transaction draft.
- Missing-field clarification.
- User confirmation before saving.

## 13.9 WhatsApp Integration

WhatsApp is a planned optional input channel.

Do not present it as an active feature until policy, provider access, technical integration, consent, security, and account-linking requirements have been verified.

---

# 14. Accessibility

Accessibility is part of the product design, not an optional enhancement.

Requirements:
- Semantic HTML.
- Keyboard navigation.
- Visible focus states.
- Accessible labels.
- Proper heading hierarchy.
- Contrast appropriate for text and interactive elements.
- Minimum touch target 44px.
- Meaningful icon labels.
- Dialog focus management.
- Reduced-motion support.
- Error messages associated with relevant inputs.
- Charts with alternative readable summaries.

Do not communicate success, warning, or failure using color alone.

---

# 15. Content and Microcopy

MyDuid uses Indonesian as its primary interface language.

Tone:
- Friendly.
- Simple.
- Respectful.
- Neutral.
- Helpful.
- Not judgmental.

Examples:

Good:
- "Pengeluaranmu bulan ini meningkat dibanding bulan lalu."
- "Kamu sudah menggunakan 75% anggaran makan."
- "Yuk, tentukan target tabungan pertamamu."
- "Transaksi berhasil disimpan."

Avoid:
- "Kamu boros banget!"
- "Keuanganmu buruk."
- "Kamu gagal mengatur uang."

Do not overuse exclamation marks, slang, or decorative language in financial information.

---

# 16. Empty, Loading, Error and Success States

Every data-driven page should consider:

### Loading
- Use skeleton consistent with final layout.
- Avoid flashing empty content during loading.

### Empty
- Explain why no data is available.
- Provide a useful next action.

### Error
- Show understandable messages.
- Preserve user input where possible.
- Provide retry where appropriate.
- Never silently ignore important failures.

### Success
- Confirm the actual server result.
- Provide a clear message.
- Refresh authoritative data where needed.

### Disabled
- Explain why an action is unavailable when appropriate.

---

# 17. Technical Design Constraints

These rules are mandatory:

1. Follow `AGENTS.md`.
2. Reuse existing components and utilities.
3. Do not replace existing working API features with mock data.
4. Do not create duplicate pages, routes, services, or components.
5. Do not change backend behavior during a frontend-only task.
6. Do not introduce new dependencies without permission.
7. Do not use hardcoded hex values in page components.
8. Do not use emoji as UI icons.
9. Do not use floating-point arithmetic for Rupiah.
10. Do not store authentication tokens in browser storage.
11. Do not claim a financial transaction succeeded until the backend confirms it.
12. Do not give AI unrestricted database access.
13. Respect account isolation and authorization.
14. Do not make destructive changes to existing database migrations.
15. Do not implement roadmap features outside the assigned task.

---

# 18. Implementation Roadmap

The approved development order:

## Phase 1 — UI/UX Foundation
- 1A: Design system and design tokens.
- 1B: Theme switcher and appearance preferences.
- 1C: Header, sidebar, bottom navigation, and quick action sheet.
- 1D: Reusable UI components and microinteractions.
- 1E: Responsive and accessibility refinement.

## Phase 2 — Core Pages
- Dashboard.
- Transactions.
- Wallets.
- Budgets.
- Reports.
- Categories.

## Phase 3 — Smart Input
- Receipt OCR.
- Voice transaction.
- Smart categorization.
- Duplicate detection.
- Recurring transactions.

## Phase 4 — AI Assistant
- Secure financial tools.
- Financial questions.
- Automatic insights.
- Check Before Spending.
- User-confirmed draft actions.

## Phase 5 — External Integrations
- WhatsApp after policy and technical verification.
- Notifications.
- Import/export.
- Additional integrations.

Do not jump phases without an explicit decision from the project owner.

---

# 19. Definition of Done — Design Quality

A UI implementation is not complete just because it looks attractive in one screenshot.

Before marking a task complete, check:

- [ ] Consistent theme tokens.
- [ ] Consistent typography.
- [ ] Consistent spacing and radius.
- [ ] No duplicated components unnecessarily.
- [ ] No hardcoded color values in UI components.
- [ ] Mobile layout is usable.
- [ ] Desktop layout uses available space effectively.
- [ ] Buttons have interactive states.
- [ ] Forms have validation and error states.
- [ ] Loading and empty states exist.
- [ ] Success feedback reflects server results.
- [ ] Keyboard focus is visible.
- [ ] Reduced motion is respected.
- [ ] Financial values are formatted correctly.
- [ ] Existing API functionality is preserved.
- [ ] No unrelated feature was modified.
- [ ] Build and relevant checks pass.

---

# 20. Motion & Loading System (Task 1E Standard)

## 20.1 Primitives
MyDuid menggunakan motion system yang ringan, berfokus pada kejelasan finansial tanpa memperlambat interaksi pengguna:
- `PageTransition`: Pembungkus route level dengan `transitionKey` (animasi `fade-in` + translasi vertikal halus 6px).
- `PageHeaderMotion`: Transisi judul halaman blur-to-sharp (`header-enter`) dan deskripsi dengan durasi singkat (0.35s).
- `SectionMotion`: Entrance untuk container/widget/kartu dengan konfigurasi `delay` terukur.
- `StaggerContainer` & `StaggerItem`: Animasi bertahap untuk list transaksi dan item anggaran (maksimal delay 280ms agar interaksi tetap responsif).
- `prefers-reduced-motion`: Wajib dihormati di CSS global (`index.css`), menonaktifkan delay, filter blur, dan transform gerakan.

## 20.2 MyDuid Signature Loader (`MyDuidLoader`)
Komponen loader khas berbentuk folding wallet 3D SVG dengan koin melayang bertema tokens:
- Variasi:
  - `inline`: Digunakan dalam tombol (`Button.tsx`) atau indikator status ringkas.
  - `section`: Digunakan saat memuat area konten (misal bagian daftar dompet, anggaran, atau kartu ringkasan).
  - `full`: Digunakan untuk overlay transisi penting dengan backdrop blur halus.
- Parameter teks `message`: Menampilkan pesan ramah kontekstual seperti *"Menyiapkan data keuangan Anda..."*.

---

# 21. Final Design Direction

MyDuid should feel like a modern, warm, intelligent financial companion.

The experience should combine:
- The clarity of a professional finance dashboard.
- The simplicity of a friendly personal app.
- The usefulness of a financial assistant.
- The warmth of a recognizable visual identity.
- The trustworthiness required by an application that handles personal financial data.

**MyDuid — Your Money, Understood.**