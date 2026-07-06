# 🚀 Peta Jalan Pengembangan KSEUNRIPedia (Roadmap & Future Updates)

Dokumen ini ditulis sebagai panduan dan inspirasi bagi **Developer Penerus** dari Divisi Pendidikan & Pelatihan (Diklat) Paguyuban Karya Salemba Empat Universitas Riau (KSE UNRI). Dokumen ini merangkum ide-ide fitur masa depan yang sangat potensial untuk dikembangkan agar KSEUNRIPedia semakin hebat, aman, dan bermanfaat.

---

## 📅 Rencana Fitur & Pembaruan Selanjutnya

### 1. 🖼️ Ekstraksi & Tampilan Banner Lomba (Poster Image Scraper)
* **Deskripsi**: Menampilkan poster resmi dari masing-masing lomba/kegiatan pada kartu beranda dan modal detail, bukan lagi menggunakan ikon bawaan.
* **Ide Implementasi**:
  * **Scraper**: Tingkatkan script `py/scraper_kabarlomba.py` agar mengekstrak tautan gambar (`<img>` tag dengan kelas `.post-body img`) dari artikel sumber.
  * **AI Parsing**: Minta Gemini API mengidentifikasi URL poster utama yang paling relevan jika terdapat banyak gambar di dalam artikel.
  * **Penyimpanan**: Kirim URL gambar tersebut ke kolom baru di Google Sheets (misal: `LINK_BANNER`), lalu muat pada tag `<img src="...">` di berkas `js/script.js`.

### 2. 🔔 Notifikasi Langsung ke Pengguna (Web Push & Telegram Subscriber)
* **Deskripsi**: Mengirimkan pemberitahuan instan langsung ke perangkat HP/Laptop pengguna ketika ada info lomba kategori tertentu yang baru dirilis.
* **Ide Implementasi**:
  * **Web Push API**: Menggunakan Service Worker untuk mendaftarkan langganan notifikasi browser.
  * **Telegram Subscriber Bot**: Membuat bot Telegram interaktif khusus di mana mahasiswa bisa mengetik `/subscribe` dan memilih minat bidangnya (misalnya: hanya ingin info *Magang* atau *Beasiswa*).

### 3. 📱 PWA (Progressive Web App)
* **Deskripsi**: Membuat KSEUNRIPedia dapat diunduh dan diinstal seperti aplikasi native di HP Android maupun iOS tanpa perlu masuk ke Play Store/App Store.
* **Ide Implementasi**:
  * Buat berkas `manifest.json` yang berisi konfigurasi ikon aplikasi dan tema warna.
  * Terapkan *Service Worker* dasar (`sw.js`) untuk menyimpan aset statis (HTML, CSS, JS, Gambar) di dalam cache browser agar web tetap bisa dibuka meskipun saat kuota habis atau luring (offline).

---

## ✔️ Fitur yang Telah Diintegrasikan

### 1. 🗄️ Pengarsipan Otomatis Lomba Kadaluarsa (Auto-Archive)
* **Status**: Selesai (Diintegrasikan Juli 2026)
* **Deskripsi**: Menggunakan Google Apps Script berbasis pemicu harian (*daily time-driven trigger*) di Google Sheet untuk otomatis memindahkan baris data kadaluarsa ke sheet `Archive`, ditambah penyaringan real-time sisi frontend.

### 2. 📊 Dashboard Statistik & Analitik Diklat
* **Status**: Selesai (Diintegrasikan Juli 2026)
* **Deskripsi**: Menyediakan visualisasi data interaktif (menggunakan Chart.js) di dalam panel admin untuk melihat statistik jenis data, proporsi kategori, biaya, dan bidang lomba secara langsung dari database Google Sheet.

---

## 🛠️ Tips Untuk Developer Penerus

1. **Gaya Kode (Coding Style)**:
   * Pertahankan konsep **Zero-Build & Zero-Boilerplate** untuk frontend (tetap gunakan Vanilla JS/CSS agar web ringan).
   * Selalu validasi sintaksis JS lokal sebelum melakukan push.
2. **Keamanan Kredensial**:
   * **JANGAN PERNAH** menuliskan Token Bot Telegram atau Kunci API secara keras (*hardcoded*) di dalam berkas python. Gunakan berkas `.env` secara lokal dan gunakan *Secrets* di GitHub Actions.
3. **Pengembangan Bertahap**:
   * Kerjakan pembaruan di branch terpisah (`git checkout -b nama-fitur`) sebelum menggabungkannya ke branch `main`.

---
*Dokumen ini dibuat untuk menjaga estafet perjuangan digital Divisi Pendidikan & Pelatihan Paguyuban KSE UNRI.* 💪🎓
