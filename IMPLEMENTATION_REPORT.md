# Laporan Perbaikan Gold Signal Simulator

Tanggal: 6 September 2026  
Versi hasil: 2.3 (lihat bagian "Penyempurnaan versi 2.3" di bawah untuk revisi terbaru)

## Ringkasan

Simulator telah diperbaiki menjadi paket situs statis berbahasa utama Inggris yang dapat dipasang melalui GitHub Pages. Fokus produk diperjelas menjadi staged pullback signal untuk spot metal, mining stocks, ETF, dan gold-backed crypto.

## Penyempurnaan versi 2.3 (oleh Claude, 6 September 2026)

Revisi ini diaudit langsung dari isi ZIP lengkap (`dist/`, `.github/`, `scripts/`), bukan hanya dari `index.html` saja, untuk memastikan klaim di README dan laporan ini benar-benar cocok dengan file yang ada.

### Ditemukan dan diperbaiki
- **Workflow GitHub Actions yang didokumentasikan ternyata tidak pernah disertakan.** README dan laporan versi 2.2 menyebut dua workflow (`daily-signals.yml` dan deployment) serta folder `.github/workflows`, tapi folder tersebut kosong di paket yang diterima. Dua workflow baru dibuat dari nol: `update-signals.yml` (menjalankan `scripts/update-signals.mjs` terjadwal + commit data + kirim Telegram) dan `deploy-pages.yml` (deploy `dist/` ke GitHub Pages), keduanya sudah divalidasi sebagai YAML yang sah.
- **Kinesis Gold (KAU) dihapus dari seluruh aset live.** Dicek langsung ke CoinGecko: KAU hanya diperdagangkan di 1–3 exchange kecil dengan harga yang sangat tidak konsisten antar sumber, dan tidak ada kepastian simbol TradingView `KINESIS:KAUUSD` benar-benar valid. Dihapus dari `index.html` (ASSETS array, semua bahasa, schema JSON-LD, FAQ), `scripts/update-signals.mjs`, `methodology.html` (dicatat sebagai entri changelog v2.1 yang transparan), dan artikel perbandingan aset.
- **Bagian Signal Board, Cross-Asset Ratios, dan Comparison yang dihapus di versi 2.1 dikembalikan ke halaman utama**, karena permintaan eksplisit pemilik situs adalah memastikan "seluruh menu bisa berjalan" — kode JS untuk fitur-fitur ini sudah ada dan berfungsi baik (sudah diuji dengan data sintetis), hanya markup HTML-nya yang hilang. Ditambahkan kembali dengan rapi (termasuk tabel backtest yang bisa dilipat/disembunyikan) agar tampilan tetap bersih.
- **Konsistensi 6 bahasa diperbaiki menyeluruh**: teks intro (TL;DR), FAQ soal notifikasi, dan kartu "Metodologi" sebelumnya hanya diperbarui di bahasa Inggris saat KAU sempat ditambahkan, membuat 5 bahasa lain tidak sinkron. Ditambahkan juga 167 kunci terjemahan baru (navigasi, trust-strip, tier grid, watchlist, perbandingan, backtest) yang sebelumnya hanya ada dalam bahasa Inggris — sekarang identik di keenam bahasa (diverifikasi otomatis, nol kunci hilang).
- **Domain goldalert.org dipasang di seluruh file**: canonical tag, Open Graph, JSON-LD, `robots.txt`, `sitemap.xml`, dan file `CNAME` baru ditambahkan untuk custom domain GitHub Pages.
- **Logo/ikon PWA dilengkapi.** `icon-source.svg` yang sudah ada (motif pulsa sinyal dalam cincin emas) dijadikan identitas resmi; ukuran yang belum ada (favicon 16/32, apple-touch-icon 180, versi maskable, `.ico`) digenerate darinya agar PWA benar-benar terpasang lengkap di semua platform.
- **Sistem artikel dibuat mudah diperbarui**: ditambahkan `articles/articles.json` (manifest) dan `articles.html` (indeks yang otomatis menampilkan seluruh artikel dari manifest tersebut) serta `articles/TEMPLATE.html` berisi instruksi langkah-demi-langkah. Menambah artikel baru sekarang hanya perlu dua langkah: salin template + isi, lalu tambah satu entri JSON — tidak perlu mengedit halaman lain.
- Halaman `about.html`, `contact.html`, `privacy.html`, `terms.html`, `methodology.html`, dan kedua artikel diperbarui: rebrand ke "GoldAlert", ditambahkan favicon/canonical/manifest, dan navigasi silang dilengkapi (link Articles & Contact yang sebelumnya belum ada di semua halaman).
- `manifest.webmanifest` dan `sw.js` diperbarui: ikon maskable ditambahkan, shell cache mencakup halaman-halaman baru (articles.html dan kedua artikel).

### Belum sempat/tidak bisa dikerjakan oleh Claude (tetap perlu akun atau keputusan pemilik situs)
Daftar di bagian "Perlu dilakukan oleh pemilik situs" dan "Belum dilakukan" di bawah masih berlaku sepenuhnya — lihat juga bagian 5 README.md untuk versi terbaru daftar ini.

## Penyempurnaan versi 2.2

- Ditambahkan dua ruang iklan responsif di antara Real-Time Chart, Markets at a Glance, dan Buy Signal Rule.
- Ruang pertama disiapkan untuk creative 970×90 pada desktop atau 320×100 pada mobile.
- Ruang kedua disiapkan untuk sponsor precious metals, investing, fintech, atau market-data.
- Pilihan tema diubah dari dropdown menjadi tombol **Dark | Light** yang terlihat jelas.
- Ditambahkan trust strip: Rule-based signals, No login required, Transparent methodology, dan sumber data.
- Ruang iklan mempunyai tinggi tetap untuk mengurangi pergeseran halaman saat kode iklan nanti dimuat.

## Koreksi tampilan versi 2.1

- Bagian Cross-Asset Ratios dihapus dari halaman utama.
- Bagian Signal Board — All Assets beserta tabel backtest dihapus dari halaman utama.
- Bagian Normalized Asset Comparison dihapus dari halaman utama.
- Status sinyal utama dipertahankan pada kartu ringkasan Gold dan Silver agar fungsi inti simulator tetap terlihat.
- Ditambahkan pilihan **Dark theme** dan **Light theme** di bagian kanan atas.
- Light theme memakai latar putih, panel putih, garis abu-abu lembut, teks navy, serta aksen emas bergaya situs finansial profesional.
- Tema yang dipilih disimpan pada perangkat dan digunakan kembali saat kunjungan berikutnya.
- Widget TradingView ikut berganti antara tema gelap dan terang.

## Sudah dilakukan

### 1. Logika sinyal utama

- 0–2 hari turun berturut-turut: **HOLD**.
- 3–4 hari turun berturut-turut: **50% BUY / WATCH**.
- 5 hari atau lebih: **100% BUY / STRONG**.
- Kedua tingkatan berjalan bersamaan; pengguna tidak lagi kehilangan sinyal 3 hari saat memilih backtest 5 hari.
- Minimum total drop tetap dapat digunakan sebagai filter tambahan.
- CSV sekarang mengekspor status 50% BUY, 100% BUY, atau HOLD.

Catatan: label 50% dan 100% adalah tahapan aturan, bukan probabilitas keuntungan dan bukan instruksi persentase dana.

### 2. Backtest dan transparansi

- Statistik dipisahkan per aset.
- Ditambahkan average forward return dan win rate untuk 5, 10, dan 20 trading days.
- Sampel kurang dari lima observasi diberi tanda.
- Ditambahkan halaman Methodology dan version history.

### 3. Aset dan analisis

- Kinesis Gold (KAU) ditambahkan sehingga crypto gold mencakup PAXG, XAUT, dan KAU.
- Cross-asset ratio memakai tanggal perdagangan yang sama agar tidak mencampur penutupan dari hari berbeda.
- Ditambahkan normalized comparison chart dua aset dengan nilai awal 100.
- Ditambahkan private watchlist dan notional P/L tanpa login, disimpan hanya pada perangkat pengguna.

### 4. Data dan otomatisasi gratis

- Disiapkan workflow GitHub Actions untuk mengambil daily history gratis dan membuat JSON statis.
- Halaman mengutamakan JSON terjadwal dan menggunakan sumber langsung sebagai fallback.
- Workflow dapat mengirim Telegram Channel alert ketika aset baru memasuki level 50% atau naik ke 100%.
- Bot token disimpan melalui GitHub Secrets dan tidak pernah diminta dari pengunjung.
- Disiapkan workflow deployment GitHub Pages dari folder `dist`.

### 5. Keamanan notifikasi

- Form input Telegram bot token dan webhook milik pengunjung dihapus.
- Klaim bahwa notifikasi browser bekerja ketika halaman ditutup telah dikoreksi.
- Browser alert sekarang dijelaskan hanya bekerja selama halaman terbuka.
- Telegram terjadwal dipindahkan ke workflow server-side GitHub Actions.

### 6. SEO, trust, dan monetisasi

- Metadata contoh `example.com`, kode Search Console palsu, dan OG image yang belum tersedia dihapus dari halaman utama.
- Ditambahkan `robots.txt`, `sitemap.xml`, `llms.txt`, `ads.txt`, manifest PWA, service worker, dan ikon aplikasi.
- Ditambahkan halaman About, Contact, Privacy, Terms, dan Methodology.
- Dua artikel asli berbahasa Inggris dibuat dan link artikel tidak lagi menuju `#`.
- Disclosure affiliate dikoreksi: link sekarang dinyatakan sebagai standard outbound links sampai diterima program affiliate.
- Ruang iklan tetap dipertahankan tanpa memasukkan ID jaringan iklan palsu.

### 7. Pemeriksaan teknis

- JavaScript halaman utama dan script pembaruan data lolos pemeriksaan sintaks.
- Tidak ditemukan ID HTML duplikat.
- Semua link file lokal utama tersedia.
- Paket tetap responsif dan mempertahankan visual dark navy–gold dari versi awal.

## Perlu dilakukan oleh pemilik situs

1. Menentukan alamat GitHub Pages atau membeli custom domain.
2. Mengganti `YOUR-DOMAIN.example` di `robots.txt` dan `sitemap.xml`.
3. Menambahkan canonical URL dan `og:url` setelah domain final tersedia.
4. Mengisi nama publisher dan business email pada Contact, Privacy, dan Terms.
5. Mengaktifkan GitHub Pages menggunakan opsi GitHub Actions.
6. Jika ingin Telegram: membuat bot/channel dan memasukkan `TELEGRAM_BOT_TOKEN` serta `TELEGRAM_CHAT_ID` ke GitHub Secrets.
7. Mengajukan program affiliate, lalu mengganti link standar dengan link affiliate yang telah disetujui.
8. Mengajukan jaringan iklan setelah konten dan trafik cukup, lalu mengisi `ads.txt`.
9. Membuat properti Search Console dan mengirim sitemap.

## Belum dilakukan

### Email personal otomatis

Belum dibuat karena GitHub Pages tidak mempunyai database pelanggan atau layanan pengiriman email. Fitur ini memerlukan backend/email provider dan pengelolaan consent, unsubscribe, serta perlindungan data.

### Push notification saat browser tertutup

PWA telah disiapkan, tetapi true web push membutuhkan push service, service-worker subscription storage, dan backend. Browser notification yang tersedia sekarang hanya aktif saat halaman dibuka.

### Validasi harga dari dua sumber independen

TradingView digunakan untuk visual chart dan Stooq/CoinGecko untuk daily signal. Belum ada proses formal yang membandingkan setiap daily close dengan vendor harga kedua dan menahan publikasi jika selisih melewati batas tertentu.

### Jaringan iklan dan akun affiliate aktif

Kode AdSense atau jaringan iklan tidak dipasang karena publisher ID belum tersedia. Link affiliate juga belum dapat diaktifkan sebelum persetujuan masing-masing program.

### Legal review

Halaman kebijakan sudah tersedia sebagai template operasional, tetapi identitas publisher, yurisdiksi, ketentuan regional, dan consent iklan tetap harus diperiksa sesuai negara target.

### Berita editorial otomatis

Widget TradingView tetap menjadi sumber berita live. Ringkasan editorial “why gold moved today” belum dihasilkan otomatis karena membutuhkan proses kurasi, sumber berita berlisensi, atau review manusia agar tidak menerbitkan kesimpulan yang keliru.

### SEO multibahasa penuh

Selector enam bahasa dipertahankan, tetapi halaman bahasa belum mempunyai URL masing-masing dan belum menggunakan `hreflang`. Fokus SEO versi ini tetap bahasa Inggris sesuai target pasar utama.

## Prioritas lanjutan

1. Publikasikan ke GitHub Pages dan jalankan workflow data pertama.
2. Lengkapi domain, publisher identity, legal pages, canonical, dan sitemap.
3. Uji data 30 hari dan periksa kegagalan sumber pada GitHub Actions.
4. Publikasikan dua sampai empat artikel berkualitas per bulan.
5. Setelah trafik stabil, aktifkan affiliate terlebih dahulu; iklan display menyusul agar pengalaman pengguna tidak cepat dipenuhi iklan.

## Isi paket

- Situs siap GitHub Pages di folder `dist`.
- Dua workflow otomatis di `.github/workflows`.
- Script daily data dan Telegram alert di `scripts`.
- README dengan langkah pemasangan.
- Laporan implementasi ini.
