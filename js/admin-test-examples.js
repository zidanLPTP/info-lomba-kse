/**
 * CONTOH DATA & TEST CASES
 * Gunakan ini untuk testing admin parser
 */

// ============================================
// CONTOH 1: LOMBA NASIONAL (COMPLETE DATA)
// ============================================
const CONTOH_LOMBA_LENGKAP = `🏆 KOMPETISI NASIONAL PROGRAMMING EXCELLENCE 2025

Penyelenggara:
Universitas Teknologi Indonesia & Tech Community

Deskripsi:
Kompetisi programming nasional untuk mahasiswa dengan tujuan meningkatkan skill coding, networking, dan kesempatan bekerja di tech companies terkemuka.

Timeline Pendaftaran:
• Dibuka: 15 Januari 2025
• Batas Akhir: 30 Maret 2025
• Pengumuman Finalis: 10 April 2025
• Kompetisi: 25 April 2025

Hadiah Total Rp 100 Juta:
🥇 Juara 1: Rp 50 Juta + Internship paid di PT A
🥈 Juara 2: Rp 30 Juta
🥉 Juara 3: Rp 20 Juta
Peserta: Sertifikat + Materi Eksklusif

Biaya Pendaftaran: GRATIS
Tipe Partisipasi: Kelompok (3-4 orang)
Level: Mahasiswa D3/D4/S1
Kategori: Nasional
Bidang: Teknologi & Digital
Pelaksanaan: Online + Offline (Grand Final)

Link Pendaftaran:
→ https://forms.gle/abc123xyz

Contact Person:
📱 WhatsApp: 0812-1234-5678
📧 Email: kompetisi@utm.ac.id
📍 Instagram: @kompetisi_programming_2025
`;

// ============================================
// CONTOH 2: SEMINAR (MINIMAL DATA)
// ============================================
const CONTOH_SEMINAR_MINIMAL = `WEBINAR DIGITAL TRANSFORMATION 2025

Oleh: Deloitte Indonesia
Tanggal: 20 Januari 2025
Link: bit.ly/webinar-digital

Hubungi: 0831-5555-6666
Gratis dan Terbuka untuk Umum
`;

// ============================================
// CONTOH 3: MAGANG (MODERATE DATA)
// ============================================
const CONTOH_MAGANG_STANDARD = `PROGRAM MAGANG SUMMER 2025

Perusahaan: PT Tech Startup Indonesia
Lokasi: Jakarta (Remote-First)
Periode: Juni - Agustus 2025

Pembukaan: 1 Januari 2025
Deadline: 28 Februari 2025

Benefit:
✓ Stipend Rp 3 Juta/month
✓ Sertifikat resmi
✓ Akses networking eksklusif
✓ Mentoring dari industry experts
✓ Potential full-time offer

Syarat:
- Mahasiswa aktif S1/D3
- Basic Python atau JavaScript
- Komitmen 2-3 bulan full-time

Daftar: https://linktr.ee/magang-tech

Kontak: 0819-9876-543 (Whatsapp)
`;

// ============================================
// CONTOH 4: BEASISWA (DENGAN MULTIPLE DATES)
// ============================================
const CONTOH_BEASISWA_COMPLEX = `BEASISWA PENUH LUAR NEGERI - KOREA SELATAN 2025-2027

Diselenggarakan oleh: Korea-Indonesia Cultural Center & Kementerian Pendidikan

Kesempatan:
Program beasiswa 2 tahun untuk studi lanjut S2 di universitas top Korea Selatan

Tanggal Penting:
FASE 1 - Pendaftaran Online
👉 Pembukaan: 1 Februari 2025
👉 Penutupan: 31 Maret 2025

FASE 2 - Seleksi & Wawancara
👉 Pengumuman peserta wawancara: 15 April 2025
👉 Jadwal wawancara: 1-30 Mei 2025

FASE 3 - Final
👉 Pengumuman penerima: 25 Juni 2025
👉 Persiapan keberangkatan: Juli-Agustus 2025

Manfaat Beasiswa:
💰 Tuition fee penuh
🏠 Living allowance $1200/bulan
✈️ Plane ticket (PP)
📚 Research fund $500/tahun
🏥 Health insurance coverage

Persyaratan:
- Lulusan S1 tahun 2022-2024
- TOEFL ≥ 90 atau IELTS ≥ 7.0
- IPK minimal 3.0
- Sport/Leadership certificate
- Rekomendasi 3 referees

Contact & Link:
📧 scholarship@kicc.or.id
📱 +62 21-5555-8888
🌐 https://kicc.or.id/beasiswa2025

NB: Berkas dikirim dalam bahasa Inggris & Indonesia
`;

// ============================================
// CONTOH 5: SHORT TEXT (LOW QUALITY)
// ============================================
const CONTOH_LOMBA_PENDEK = `Ada lomba foto tema "Keindahan Alam Indonesia". Daftar sebelum 15 Februari. Hubungi admin.
`;

// ============================================
// HELPER: COPY KE CLIPBOARD & PASTE KE ADMIN
// ============================================

function copyToClipboard(text, name) {
    navigator.clipboard.writeText(text).then(() => {
        alert(`✅ Contoh "${name}" sudah dicopy!\n\nSekarang:\n1. Buka https://kseunripedia.my.id/admin\n2. Paste ke textarea\n3. Klik "Parsing Otomatis & Ekstrak Data"`);
    });
}

function showAllExamples() {
    const examples = [
        { name: "Contoh 1: Lomba Lengkap", data: CONTOH_LOMBA_LENGKAP },
        { name: "Contoh 2: Seminar Minimal", data: CONTOH_SEMINAR_MINIMAL },
        { name: "Contoh 3: Magang Standard", data: CONTOH_MAGANG_STANDARD },
        { name: "Contoh 4: Beasiswa Complex", data: CONTOH_BEASISWA_COMPLEX },
        { name: "Contoh 5: Lomba Pendek", data: CONTOH_LOMBA_PENDEK }
    ];

    let html = `
        <div style="max-width: 600px; background: white; padding: 20px; border-radius: 10px;">
            <h2>📋 Pilih Contoh Data untuk Testing</h2>
            <p style="color: #666;">Click tombol untuk copy contoh ke clipboard, lalu paste di admin parser</p>
            <hr>
    `;

    examples.forEach((ex, idx) => {
        html += `
            <button onclick="copyToClipboard(\`${ex.data.replace(/`/g, '\\`')}\`, '${ex.name}')" 
                    style="display: block; width: 100%; padding: 12px; margin: 8px 0; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                ${idx + 1}. ${ex.name}
            </button>
        `;
    });

    html += `
        </div>
        <script>
            // Show in console
            console.log('✅ Admin Parser Examples loaded!');
            console.log('Gunakan perintah di console:');
            console.log('copyToClipboard(CONTOH_LOMBA_LENGKAP, "Contoh 1")');
        </script>
    `;

    return html;
}

// ============================================
// EXPECTED OUTPUT SETELAH PARSING
// ============================================

const EXPECTED_OUTPUT_CONTOH_1 = {
    judul: "KOMPETISI NASIONAL PROGRAMMING EXCELLENCE 2025",
    penyelenggara: "Universitas Teknologi Indonesia & Tech Community",
    tanggal_mulai: "2025-01-15",
    deadline: "2025-03-30",
    benefit: "Rp 50 Juta + Internship paid di PT A",
    link: "https://forms.gle/abc123xyz",
    kontak: "0812-1234-5678",
    deskripsi: "Kompetisi programming nasional untuk mahasiswa dengan tujuan meningkatkan skill coding, networking, dan kesempatan bekerja di tech companies terkemuka.",
    kategori: "Nasional",
    bidang: "Teknologi & Digital",
    partisipasi: "Kelompok/Tim",
    level: "Mahasiswa D3/D4/S1",
    pelaksanaan: "Hybrid",
    biaya: "Gratis"
};

// ============================================
// UNTUK DEVELOPER: DEBUG INFO
// ============================================

console.log(`
╔════════════════════════════════════════════════════════╗
║   KSEUnriPedia Admin Parser - Test Suite               ║
╚════════════════════════════════════════════════════════╝

📚 Contoh Data Tersedia:

1. CONTOH_LOMBA_LENGKAP
   - Lengkap dengan semua field
   - Expected Data Quality: 90%+
   - Status: Ready to production

2. CONTOH_SEMINAR_MINIMAL  
   - Minimal data
   - Expected Data Quality: 50-60%
   - Status: Needs review

3. CONTOH_MAGANG_STANDARD
   - Standard structure
   - Expected Data Quality: 75-85%
   - Status: Production-ready

4. CONTOH_BEASISWA_COMPLEX
   - Complex structure, banyak dates
   - Expected Data Quality: 85-95%
   - Status: Advanced parsing

5. CONTOH_LOMBA_PENDEK
   - Short text, minimal details
   - Expected Data Quality: 30-40%
   - Status: Needs manual edit

✅ HOW TO USE:

Method 1 - Langsung di Console:
  copyToClipboard(CONTOH_LOMBA_LENGKAP, "Contoh 1")

Method 2 - Ketik di Console:
  console.log(EXPECTED_OUTPUT_CONTOH_1)

Method 3 - Show all:
  showAllExamples()

💡 TIPS:
- Test dengan data berkualitas tinggi dulu (Contoh 1)
- Bandingkan dengan EXPECTED_OUTPUT_CONTOH_1
- Cek Data Quality meter
- Validate form filling
- Check success notification

🔗 Go to Admin: https://kseunripedia.my.id/admin
`);
