document.addEventListener('DOMContentLoaded', () => {
    const btnEksekusi = document.getElementById('btnEksekusi');
    const form = document.getElementById('submissionForm');

    const radios = document.querySelectorAll('input[name="kategoriInfo"]');
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateUIBasedOnCategory(e.target.value);
        });
    });

    // Inisialisasi tampilan pertama kali
    const initialKat = document.querySelector('input[name="kategoriInfo"]:checked').value;
    updateUIBasedOnCategory(initialKat);

    btnEksekusi.addEventListener('click', () => {
        const rawText = document.getElementById('rawText').value;
        const kategori = document.querySelector('input[name="kategoriInfo"]:checked').value;

        if (!rawText.trim()) {
            alert('Teks deskripsi kosong! Silakan paste teks terlebih dahulu.');
            return;
        }

        parseText(rawText, kategori);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Mencegah reload halaman

        const btnSubmit = document.getElementById('btnSubmitForm');
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
        btnSubmit.disabled = true;

        const formData = new FormData(form);
        const urlEncodedData = new URLSearchParams(formData).toString();
        const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdkWYfU_OcJtWwRYTZios1-rUcqXjS1E9pA1yTVes5MOKucfw/formResponse';

        fetch(formUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: urlEncodedData
        }).then(() => {
            // Karena mode no-cors, status HTTP tidak terbaca, tapi promise resolved berarti request terkirim
            formSubmitSukses();
        }).catch(err => {
            console.error('Submit error:', err);
            alert('Gagal mengirim data. Periksa koneksi internet Anda.');
            btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim ke Database';
            btnSubmit.disabled = false;
        });
    });
});

function formSubmitSukses() {
    alert('Data berhasil dikirim ke Google Sheet!');
    const btnSubmit = document.getElementById('btnSubmitForm');
    btnSubmit.innerHTML = '<i class="fas fa-check"></i> Sukses Terkirim';

    setTimeout(() => {
        // Reset form
        document.getElementById('submissionForm').reset();
        document.getElementById('rawText').value = '';
        btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim ke Database';
        btnSubmit.disabled = false;
    }, 2500);
}

function updateUIBasedOnCategory(kategori) {
    const labelJudul = document.getElementById('labelJudul');
    const labelPenyelenggara = document.getElementById('labelPenyelenggara');
    const labelBenefit = document.getElementById('labelBenefit');

    const lombaFieldsRow = document.getElementById('lombaFieldsRow');
    const biayaContainer = document.getElementById('biayaContainer');
    const hiddenBiayaContainer = document.getElementById('hiddenBiayaContainer');

    // Elemen Lomba (Visible vs Hidden)
    const lombaInputs = ['Kategori', 'Bidang', 'Partisipasi', 'Pelaksanaan', 'Level'];

    if (kategori === 'Lomba') {
        labelJudul.innerHTML = 'Judul Lomba <span class="text-danger">*</span>';
        labelPenyelenggara.innerHTML = 'Penyelenggara <span class="text-danger">*</span>';
        labelBenefit.innerHTML = 'Hadiah / Benefit';

        lombaFieldsRow.style.display = 'block';
        biayaContainer.style.display = 'block';

        // Aktifkan name di visible select, hapus di hidden select
        document.getElementById('entryBiaya').name = "entry.728063400";
        document.getElementById('hiddenEntryBiaya').removeAttribute('name');

        lombaInputs.forEach(inp => {
            const visibleEl = document.getElementById('entry' + inp);
            const hiddenEl = document.getElementById('hiddenEntry' + inp);
            visibleEl.name = hiddenEl.getAttribute('data-name'); // Akan di-set di bawah
            hiddenEl.removeAttribute('name');
        });

    } else if (kategori === 'Seminar') {
        labelJudul.innerHTML = 'Tema Seminar / Webinar <span class="text-danger">*</span>';
        labelPenyelenggara.innerHTML = 'Penyelenggara <span class="text-danger">*</span>';
        labelBenefit.innerHTML = 'Benefit (Sertifikat/Ilmu)';

        lombaFieldsRow.style.display = 'none';
        biayaContainer.style.display = 'block';

        document.getElementById('entryBiaya').name = "entry.728063400";
        document.getElementById('hiddenEntryBiaya').removeAttribute('name');

    } else if (kategori === 'Magang') {
        labelJudul.innerHTML = 'Posisi Magang <span class="text-danger">*</span>';
        labelPenyelenggara.innerHTML = 'Perusahaan <span class="text-danger">*</span>';
        labelBenefit.innerHTML = 'Uang Saku & Benefit';

        lombaFieldsRow.style.display = 'none';
        biayaContainer.style.display = 'none';

        document.getElementById('hiddenEntryBiaya').name = "entry.728063400";
        document.getElementById('entryBiaya').removeAttribute('name');

    } else if (kategori === 'Lowongan Kerja') {
        labelJudul.innerHTML = 'Posisi Pekerjaan <span class="text-danger">*</span>';
        labelPenyelenggara.innerHTML = 'Perusahaan <span class="text-danger">*</span>';
        labelBenefit.innerHTML = 'Gaji & Fasilitas';

        lombaFieldsRow.style.display = 'none';
        biayaContainer.style.display = 'none';

        document.getElementById('hiddenEntryBiaya').name = "entry.728063400";
        document.getElementById('entryBiaya').removeAttribute('name');
    }

    // Jika bukan lomba, pindahkan name attribute ke hidden select agar Form tidak error 400
    if (kategori !== 'Lomba') {
        lombaInputs.forEach(inp => {
            const visibleEl = document.getElementById('entry' + inp);
            const hiddenEl = document.getElementById('hiddenEntry' + inp);

            // Simpan nama aslinya di data-name jika belum ada
            if (visibleEl.name) {
                hiddenEl.setAttribute('data-name', visibleEl.name);
                hiddenEl.name = visibleEl.name;
                visibleEl.removeAttribute('name');
            }
        });
    }
}

function parseText(text, kategori) {
    // Set Jenis Informasi langsung sesuai kategori (Pastikan di Google Form opsi Lowongan Kerja sudah ditambahkan)
    document.getElementById('entryJenis').value = kategori;

    let judul = '';
    let penyelenggara = '';
    let deadline = '';
    let kontak = '';
    let benefit = '';
    let biaya = '';
    let link = '';
    let mulai = '';

    // Default Nilai Informatif jika tidak ketemu
    const defaultJudul = "Posisi/Judul Tidak Ditemukan - Harap Cek Manual";
    const defaultPenyelenggara = "Perusahaan/Penyelenggara Tidak Diketahui";
    const defaultKontak = "Tidak ada narahubung tercantum";
    const defaultLink = "https://tidak-ada-link-tersedia.com";

    // 1. Ekstrak Judul / Posisi / Tema
    // Menangkap "Posisi:" atau "Dibutuhkan Segera:" dan mengambil baris setelahnya jika baris saat ini kosong/hanya simbol
    const posMatch = text.match(/(?:Posisi(?: Tersedia)?|Vacancy|Tema|Topik|Dibutuhkan(?: Segera)?|Hiring)[^a-z0-9\n]*\n*([^a-z0-9\n]*[a-z0-9][^\n]+)/i);
    if (posMatch && posMatch[1].trim().length > 3) {
        judul = posMatch[1].replace(/^[^\w\s]+/g, '').trim(); // Hilangkan emoji di awal jika ada
    } else {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3 && !l.toLowerCase().includes('kesempatan emas') && !l.includes('🚨') && !l.toLowerCase().includes('lowongan kerja'));
        judul = lines.length > 0 ? lines[0].replace(/^[^\w\s]+/g, '').trim() : defaultJudul;
    }

    // 2. Ekstrak Penyelenggara / Perusahaan
    const orgMatch = text.match(/(?:Perusahaan|Diselenggarakan oleh|Penempatan|Lokasi)\s*[:\-]?\s*([^\n]+)/i);
    const hiringMatch = text.match(/([a-zA-Z0-9\s\-\.&]+)\s+(?:is Hiring|is calling you)/i);
    const ptMatch = text.match(/(PT\s+[A-Za-z0-9 ]+)/i);
    const uniMatch = text.match(/(Universitas\s+[A-Za-z0-9 ]+)/i);
    const klinikMatch = text.match(/(?:Klinik|Rumah Sehat|Laundry|Toko|Outlet)\s+[A-Za-z0-9 ]+/i);

    if (orgMatch && orgMatch[1].trim().length > 2 && !orgMatch[1].toLowerCase().includes('jl.')) {
        penyelenggara = orgMatch[1].trim();
    } else if (hiringMatch && hiringMatch[1].trim().length > 2) {
        penyelenggara = hiringMatch[1].trim().replace(/^[^\w\s]+/g, ''); // Hapus emoji
    } else if (ptMatch) {
        penyelenggara = ptMatch[1].trim();
    } else if (uniMatch) {
        penyelenggara = uniMatch[1].trim();
    } else if (klinikMatch) {
        penyelenggara = klinikMatch[0].trim();
    } else {
        penyelenggara = defaultPenyelenggara;
    }

    // 3. Ekstrak Deadline / Tanggal
    const curDate = new Date();
    mulai = curDate.toISOString().split('T')[0]; // Default mulai adalah hari ini

    const dateMatch = text.match(/(?:Deadline|Batas daftar|Apply sebelum|📅)\s*[:\-]?\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{1,2}\s+[A-Za-z]+)/i);
    if (dateMatch) {
        deadline = parseDateString(dateMatch[1]);
    } else {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 14); // default 2 minggu ke depan
        deadline = nextWeek.toISOString().split('T')[0];
    }

    // 4. Ekstrak Kontak (WA / Telepon)
    const phoneMatch = text.match(/(?:(?:WA|WhatsApp|Hubungi|Admin|Contact Person|Kontak|CP)[\w\s]*[:\-]?\s*)?((?:\+62|08|62)\d{2,4}[\s\-]*\d{3,4}[\s\-]*\d{3,5})/i);
    if (phoneMatch) {
        kontak = phoneMatch[1].trim();
    } else {
        kontak = defaultKontak;
    }

    // 5. Ekstrak Benefit / Gaji
    if (kategori === 'Lowongan Kerja') {
        const gajiMatch = text.match(/(?:Gaji(?: Pokok)?|Fasilitas|Benefit(?:s)?)\s*[:\-]?\s*([^\n]+)/i);
        if (gajiMatch && gajiMatch[1].trim().length > 2) {
            benefit = gajiMatch[1].replace(/^[^\w\s]+/g, '').trim();
        } else {
            // Coba cek baris berikutnya jika baris saat ini kosong (hanya enter)
            const gajiMatchMulti = text.match(/(?:Gaji(?: Pokok)?|Fasilitas|Benefit(?:s)?)[^a-z0-9\n]*\n*([^a-z0-9\n]*[a-z0-9][^\n]+)/i);
            benefit = gajiMatchMulti ? gajiMatchMulti[1].replace(/^[^\w\s]+/g, '').trim() : 'Gaji Kompetitif & Tunjangan';
        }
    } else if (kategori === 'Magang') {
        const benefitMatch = text.match(/(?:Uang saku|Benefit(?:s)?)\s*[:\-]?\s*([^\n]+)/i);
        benefit = benefitMatch ? benefitMatch[1].trim() : 'Sertifikat & Pengalaman (Kemungkinan Unpaid)';
    } else if (kategori === 'Lomba') {
        const benefitMatch = text.match(/(?:Benefit(?:s)?|Hadiah|Penghargaan|Fasilitas)\s*[:\-]?\s*([^\n]+)/i);
        benefit = benefitMatch ? benefitMatch[1].trim() : 'Sertifikat & Uang Pembinaan';
    } else {
        benefit = 'E-Sertifikat, Materi & Relasi';
    }

    // 6. Ekstrak Biaya / Status (Harus persis dengan opsi Google Form)
    if (kategori === 'Seminar' || kategori === 'Lomba') {
        const biayaMatch = text.match(/(?:Biaya|HTM|Pendaftaran)\s*[:\-]?\s*([^\n]+)/i);
        biaya = (biayaMatch && !biayaMatch[1].toLowerCase().includes('gratis') && !biayaMatch[1].toLowerCase().includes('free')) ? 'Berbayar' : 'Gratis';
    } else {
        biaya = 'Gratis';
    }

    // 7. Ekstrak Email/Link Pendaftaran
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const linkMatch = text.match(/https?:\/\/[^\s]+/);
    if (linkMatch) {
        link = linkMatch[0];
    } else if (emailMatch) {
        link = emailMatch[0];
    } else {
        if (kontak !== defaultKontak) {
            let cleanPhone = kontak.replace(/\D/g, '');
            if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1);
            link = `https://wa.me/${cleanPhone}`;
        } else {
            link = defaultLink;
        }
    }

    // 8. Logika Spesifik Lomba
    if (kategori === 'Lomba') {
        const textLower = text.toLowerCase();

        // Kategori
        let cat = 'Nasional';
        if (textLower.includes('internasional')) cat = 'Internasional';
        else if (textLower.includes('regional')) cat = 'Regional';
        document.getElementById('entryKategori').value = cat;

        // Bidang
        let bid = 'Akademik & Bahasa';
        if (/ai|teknologi|app|software|coding|it|web/i.test(textLower)) bid = 'Teknologi & Digital';
        else if (/bisnis|startup|wirausaha|business/i.test(textLower)) bid = 'Bisnis & Kewirausahaan';
        else if (/poster|desain|seni|puisi|tari/i.test(textLower)) bid = 'Seni & Budaya';
        document.getElementById('entryBidang').value = bid;

        // Partisipasi
        let part = 'Keduanya';
        if (/individu|perorangan/i.test(textLower)) part = 'Individu';
        else if (/kelompok|tim /i.test(textLower)) part = 'Kelompok/Tim';
        document.getElementById('entryPartisipasi').value = part;

        // Pelaksanaan
        let pelak = 'Online';
        if (textLower.includes('hybrid')) pelak = 'Hybrid';
        else if (/offline|luring|di tempat/i.test(textLower)) pelak = 'Offline';
        document.getElementById('entryPelaksanaan').value = pelak;

        // Level
        let lvl = 'Umum';
        const hasSma = /sma |smk |pelajar|siswa /i.test(textLower);
        const hasMhs = /mahasiswa|kampus|universitas/i.test(textLower);
        if (hasSma && hasMhs) lvl = 'Umum';
        else if (hasMhs) lvl = 'Mahasiswa D3/D4/S1';
        else if (hasSma) lvl = 'SMA/Sederajat';
        document.getElementById('entryLevel').value = lvl;
    }

    // Set value ke form
    document.getElementById('entryJudul').value = judul;

    document.getElementById('entryPenyelenggara').value = penyelenggara;
    document.getElementById('entryMulai').value = mulai; // Set tanggal mulai
    document.getElementById('entryDeadline').value = deadline;
    document.getElementById('entryKontak').value = kontak;
    document.getElementById('entryBenefit').value = benefit;
    document.getElementById('entryBiaya').value = biaya;
    document.getElementById('entryLink').value = link;

    // Potong deskripsi jika kepanjangan (max 1000 char untuk aman di google form)
    let deskripsiAman = text.trim();
    if (deskripsiAman.length > 800) deskripsiAman = deskripsiAman.substring(0, 800) + '... (selengkapnya cek link)';
    document.getElementById('entryDeskripsi').value = deskripsiAman;
}

function parseDateString(dateStr) {
    try {
        const mapBulan = {
            'januari': '01', 'februari': '02', 'maret': '03', 'april': '04',
            'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08',
            'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
        };
        const parts = dateStr.trim().toLowerCase().split(/\s+/);
        if (parts.length >= 2) {
            let day = parts[0];
            if (day.length === 1) day = '0' + day;
            let month = mapBulan[parts[1]] || '01';
            let year = parts[2] || new Date().getFullYear();
            return `${year}-${month}-${day}`;
        }
    } catch (e) {
        console.error(e);
    }
    const future = new Date();
    future.setDate(future.getDate() + 14);
    return future.toISOString().split('T')[0];
}
