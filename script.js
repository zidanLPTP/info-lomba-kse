// =============================================
// MAIN APPLICATION LOGIC - SMART HEADER VERSION
// =============================================

class InfoLombaApp {
    constructor() {
        this.isInitialized = false;
        this.allData = [];
        this.currentFilters = {
            search: '',
            status: 'all',
            category: 'all',
            type: 'all'
        };
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing Info Lomba KSE App...');
            this.initEventListeners();
            await this.loadData();
            this.isInitialized = true;
            console.log('✅ App initialized successfully');
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showError('Gagal memuat data. Silakan refresh halaman.');
        }
    }

    initEventListeners() {
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', this.debounce(() => {
            this.currentFilters.search = searchInput.value;
            this.renderData();
        }, 300));

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilters.status = e.target.dataset.filter;
                this.renderData();
            });
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('refresh-btn')) {
                this.loadData();
            }
        });
    }

    async loadData() {
        try {
            this.showLoading(true);
            const apiUrl = `${CONFIG.SHEETS_TO_API.BASE_URL}/${CONFIG.SHEETS_TO_API.USER_KEY}/${encodeURIComponent(CONFIG.SHEETS_TO_API.SHEET_NAME)}`;
            
            console.log('📥 Fetching data from:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            
            // === DIAGNOSTIC TOOL ===
            // Ini akan mencetak nama-nama kolom yang BENAR-BENAR diterima dari API
            if (data.data && data.data.length > 0) {
                console.log('🔍 DIAGNOSTIK HEADER (Nama kolom yang terbaca):', Object.keys(data.data[0]));
            }
            // =======================

            console.log('📊 Raw Data Count:', data.data ? data.data.length : 0);

            this.allData = this.processApiData(data.data);
            
            console.log(`✅ Processed ${this.allData.length} valid records`);
            this.renderData();

        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.showError(`Gagal memuat data: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    // FUNGSI BARU: Mencari kolom dengan cerdas (mengabaikan spasi & huruf besar)
    findValueByKey(record, searchKey) {
        // 1. Cek exact match dulu
        if (record[searchKey] !== undefined) return record[searchKey];

        // 2. Cari yang mirip (trim spasi & uppercase)
        const keys = Object.keys(record);
        const foundKey = keys.find(k => 
            k.trim().toUpperCase() === searchKey.trim().toUpperCase()
        );

        return foundKey ? record[foundKey] : undefined;
    }

    processApiData(apiData) {
        if (!Array.isArray(apiData)) return [];
        
        return apiData.map((record, index) => {
            // Helper membersihkan field menggunakan pencarian cerdas
            const clean = (key, fallback) => {
                const val = this.findValueByKey(record, key);
                if (!val || val.toString().trim() === '' || val.toString().trim() === '-') return fallback;
                return val.toString().trim();
            };

            // --- UPDATED LOGIC STARTS HERE ---
            
            // 1. Cek apakah baris ini benar-benar kosong (semua value "")
            const values = Object.values(record);
            const isRowEmpty = values.every(val => !val || val.toString().trim() === "");

            // Jika baris kosong, return null tanpa warning (SILENT SKIP)
            if (isRowEmpty) return null;

            // 2. Cek field wajib
            const namaLomba = clean('NAMA LOMBA', null);
            const penyelenggara = clean('PENYELENGGARA', null);

            // Jika baris ada isinya TAPI Nama/Penyelenggara kosong, baru kasih warning
            if (!namaLomba || !penyelenggara) {
                // Uncomment baris bawah ini hanya jika kamu ingin debugging data rusak
                // console.warn(`⚠️ Skipped Row ${index + 2}: Missing Name/Organizer`);
                return null;
            }

            // --- UPDATED LOGIC ENDS HERE ---

            let rawStatus = this.findValueByKey(record, 'STATUS_APPROVAL') || 'PENDING';
            rawStatus = rawStatus.toString().toUpperCase().trim();

            const cleaned = {
                id: 'lomba_' + Math.random().toString(36).substr(2, 9),
                namaLomba: namaLomba,
                penyelenggara: penyelenggara,
                
                kategori: clean('KATEGORI', 'Umum'),
                jenisPartisipasi: clean('JENIS PARTISIPASI', 'Tidak ada data'),
                levelPeserta: clean('LEVEL PESERTA', 'Tidak ada data'),
                bidang: clean('BIDANG LOMBA', 'Umum'),
                
                hadiah: clean('HADIAH & PENGHARGAAN', 'Tidak ada info hadiah'),
                biaya: clean('BIAYA PENDAFTARAN', 'Tidak diketahui'),
                
                tanggalMulai: clean('TANGGAL MULAI PENDAFTARAN', ''),
                deadline: clean('DEADLINE PENDAFTARAN', ''),
                
                linkPendaftaran: clean('LINK PENDAFTARAN/RESMI', ''),
                contactPerson: clean('NARAHUBUNG', 'Tidak ada kontak'),
                deskripsi: clean('DESKRIPSI SINGKAT LOMBA', 'Tidak ada deskripsi.'),
                inputBy: clean('DIVISI YANG MENGINPUT DATA', 'Anonim'),
                
                statusApproval: rawStatus,
                timestamp: new Date().toISOString()
            };

            cleaned.status = this.calculateStatus(cleaned.tanggalMulai, cleaned.deadline);
            cleaned.urgency = this.calculateUrgency(cleaned.deadline, cleaned.status);
            cleaned.simplifiedHadiah = this.simplifyHadiah(cleaned.hadiah);

            return cleaned;
        }).filter(record => record !== null);
    }

    filterData() {
        let filtered = this.allData;

        // 1. Filter APPROVED (Lebih longgar: cek apakah mengandung kata APPROVED)
        filtered = filtered.filter(item => {
            return item.statusApproval.includes('APPROVED');
        });

        // 2. Filter Search
        if (this.currentFilters.search) {
            const term = this.currentFilters.search.toLowerCase();
            filtered = filtered.filter(item => 
                item.namaLomba.toLowerCase().includes(term) ||
                item.penyelenggara.toLowerCase().includes(term) ||
                item.bidang.toLowerCase().includes(term)
            );
        }

        if (this.currentFilters.status !== 'all') {
            filtered = filtered.filter(item => item.status === this.currentFilters.status);
        }
        if (this.currentFilters.category !== 'all') {
            filtered = filtered.filter(item => item.kategori === this.currentFilters.category);
        }
        if (this.currentFilters.type !== 'all') {
            filtered = filtered.filter(item => item.jenisPartisipasi === this.currentFilters.type);
        }

        return filtered;
    }

    renderData() {
        const filteredData = this.filterData();
        const container = document.getElementById('lombaContainer');
        const noResults = document.getElementById('noResults');

        console.log(`🎨 Rendering: ${filteredData.length} items from ${this.allData.length} total`);
        
        if (filteredData.length === 0) {
            if (this.allData.length === 0) {
                this.showEmptyDataMessage();
            } else {
                container.style.display = 'none';
                noResults.style.display = 'block';
            }
        } else {
            container.style.display = 'grid';
            noResults.style.display = 'none';
            container.innerHTML = this.generateCardsHTML(filteredData);
        }
    }

    // ... HELPERS ...

    parseDate(dateString) {
        if (!dateString) return null;
        const parts = dateString.split('/');
        if (parts.length === 3) {
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
        }
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) return date;
        return null;
    }

    calculateStatus(tanggalMulai, deadline) {
        const now = new Date();
        const startDate = this.parseDate(tanggalMulai);
        const endDate = this.parseDate(deadline);
        if (!endDate || isNaN(endDate.getTime())) return 'unknown';
        if (now > endDate) return 'closed';
        if (startDate && !isNaN(startDate.getTime()) && now < startDate) return 'coming';
        return 'open';
    }

    calculateUrgency(deadline, status) {
        if (status !== 'open' || !deadline) return null;
        const now = new Date();
        const endDate = this.parseDate(deadline);
        if (!endDate || isNaN(endDate.getTime())) return null;
        const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) return null;
        if (daysLeft === 0) return { badge: "⏰ TUTUP HARI INI!", class: "urgent-critical" };
        if (daysLeft <= 1) return { badge: "🚨 BESOK TUTUP!", class: "urgent-critical" };
        if (daysLeft <= 3) return { badge: "⏰ TUTUP SEGERA", class: "urgent" };
        if (daysLeft <= 7) return { badge: "🔥 BURUAN!", class: "hot" };
        return null;
    }

    simplifyHadiah(hadiahText) {
        if (!hadiahText) return 'Tidak ada informasi hadiah';
        if (hadiahText.length > 70) return hadiahText.substring(0, 70) + '...';
        return hadiahText;
    }

    generateCardsHTML(data) {
        return data.map(item => `
            <div class="lomba-card" data-id="${item.id}">
                <div class="card-content"> 
                    <div class="card-header">
                        <span class="status-badge ${item.status}">
                            ${this.getStatusEmoji(item.status)} ${this.getStatusText(item.status)}
                        </span>
                        ${item.urgency ? `<span class="urgency-badge ${item.urgency.class}">${item.urgency.badge}</span>` : ''}
                    </div>
                    
                    <h3 class="card-title">${this.escapeHTML(item.namaLomba)}</h3>
                    
                    <div class="basic-info">
                        <span>${this.getCategoryEmoji(item.kategori)} ${item.kategori}</span>
                        <span>${this.getTypeEmoji(item.jenisPartisipasi)} ${item.jenisPartisipasi}</span>
                        <span>🎓 ${item.levelPeserta}</span>
                        <span><i class="fas fa-tag" style="opacity: 0.7;"></i> ${this.escapeHTML(item.bidang)}</span>
                    </div>
                    
                    <p class="organizer">🏛️ ${this.escapeHTML(item.penyelenggara)}</p>
                    <p class="prize">🏆 ${this.escapeHTML(item.simplifiedHadiah)}</p>
                    <p class="fee">💰 ${this.escapeHTML(item.biaya)}</p>
                    
                    <div class="deadline">
                        <strong>⏰ ${this.formatDate(item.deadline)}</strong>
                        <span class="countdown">${item.urgency ? item.urgency.badge : this.getCountdownText(item.deadline)}</span>
                    </div>
                    
                    <p class="contact">📞 ${this.escapeHTML(item.contactPerson)}</p>
                    
                    <div class="card-actions">
                        ${item.linkPendaftaran ? 
                            `<a href="${this.escapeHTML(item.linkPendaftaran)}" target="_blank" class="btn-primary">📝 Daftar Sekarang</a>` :
                            `<button class="btn-primary" disabled>📝 Link Tidak Tersedia</button>`
                        }
                        
                        <button class="btn-secondary" onclick="app.showDetail('${item.id}')">ℹ️ Detail Lengkap</button>
                    </div>
                </div> 
            </div>
        `).join('');
    }

    getStatusEmoji(status) {
        const emojis = { 'open': '🟢', 'coming': '🔵', 'closed': '🔴', 'unknown': '⚪' };
        return emojis[status] || '⚪';
    }

    getStatusText(status) {
        const texts = { 'open': 'OPEN', 'coming': 'COMING SOON', 'closed': 'CLOSED', 'unknown': 'UNKNOWN' };
        return texts[status] || 'UNKNOWN';
    }

    getCategoryEmoji(category) {
        const emojis = { 'Internasional': '🌍', 'Nasional': '🇮🇩', 'Regional': '🏠' };
        return emojis[category] || '🎯';
    }

    getTypeEmoji(type) {
        const emojis = { 'Individu': '👤', 'Kelompok': '👥' };
        return emojis[type] || '👥';
    }

    formatDate(dateString) {
        if (!dateString) return 'Tidak ada deadline';
        try {
            const date = this.parseDate(dateString); 
            if (!date || isNaN(date.getTime())) return 'Format tanggal salah';
            return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch (error) {
            return dateString;
        }
    }

    getCountdownText(deadline) {
        if (!deadline) return '';
        const now = new Date();
        const endDate = this.parseDate(deadline); 
        if (!endDate || isNaN(endDate.getTime())) return '';
        const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) return '⏰ Sudah Berakhir';
        if (daysLeft === 0) return '⏰ Tutup Hari Ini!';
        if (daysLeft === 1) return '🚀 Besok Tutup!';
        return `📅 ${daysLeft} Hari Lagi`;
    }

    showDetail(lombaId) {
        const lomba = this.allData.find(item => item.id === lombaId);
        if (!lomba) return;

        const modal = document.getElementById('detailModal');
        const modalBody = document.getElementById('modalBody');

        modalBody.innerHTML = `
            <h2 class="modal-title">${this.escapeHTML(lomba.namaLomba)}</h2>

            <div class="modal-section">
                <h5><i class="fas fa-info-circle"></i> Deskripsi</h5>
                <p>${this.escapeHTML(lomba.deskripsi)}</p>
            </div>

            <div class="modal-section">
                <h5><i class="fas fa-trophy"></i> Hadiah</h5>
                <p>${this.escapeHTML(lomba.hadiah)}</p>
            </div>

            <div class="modal-section">
                <h5><i class="fas fa-id-card"></i> Info Kontak & Pendaftaran</h5>
                <ul>
                    <li><i class="fas fa-user"></i> ${this.escapeHTML(lomba.contactPerson)}</li>
                    <li><i class="fas fa-calendar-alt"></i> Deadline: ${this.formatDate(lomba.deadline)}</li>
                </ul>
            </div>

            ${lomba.linkPendaftaran ? 
                `<a href="${this.escapeHTML(lomba.linkPendaftaran)}" target="_blank" class="btn-primary" style="width: 100%; text-align: center; padding: 1rem; font-size: 1.1rem;">📝 Kunjungi Link Pendaftaran</a>` :
                ''}
        `;

        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }

    closeDetailModal() {
        const modal = document.getElementById('detailModal');
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }

    showEmptyDataMessage() {
        const container = document.getElementById('lombaContainer');
        container.style.display = 'block';
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>Belum Ada Data Lomba</h3>
                <p>Pastikan sudah menginput data di Google Form dan statusnya "APPROVED".</p>
                <p class="small text-muted">Cek Console (F12) untuk melihat diagnostik nama kolom.</p>
            </div>
        `;
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        const container = document.getElementById('lombaContainer');
        
        if (show) {
            spinner.style.display = 'block';
            container.style.display = 'none';
        } else {
            spinner.style.display = 'none';
        }
    }

    showError(message) {
        const container = document.getElementById('lombaContainer');
        container.style.display = 'block';
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Terjadi Kesalahan</h3>
                <p>${message}</p>
                <button class="btn-primary refresh-btn" onclick="app.loadData()">🔄 Coba Lagi</button>
            </div>
        `;
    }

    escapeHTML(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => { clearTimeout(timeout); func(...args); };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.app = new InfoLombaApp();
});