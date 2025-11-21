// =============================================
// KSEUNRIPEDIA LOGIC - MULTI CATEGORY SUPPORT
// =============================================

class InfoLombaApp {
    constructor() {
        this.isInitialized = false;
        this.allData = [];
        this.currentFilters = {
            search: '',
            category: 'all', // Filter Kategori Utama
            status: 'all'    // Filter Status (Open/Closed)
        };
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing KSEUNRIPEDIA...');
            this.initEventListeners();
            await this.loadData();
            this.isInitialized = true;
        } catch (error) {
            console.error(error);
            this.showError('Gagal memuat data. Silakan refresh halaman.');
        }
    }

    initEventListeners() {
        // Search Listener
        document.getElementById('searchInput').addEventListener('input', this.debounce((e) => {
            this.currentFilters.search = e.target.value;
            this.renderData();
        }, 300));

        // Tab Kategori Utama (Lomba, Beasiswa, dll)
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('.tab-btn');
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                target.classList.add('active');
                
                this.currentFilters.category = target.dataset.category;
                this.renderData();
            });
        });

        // Filter Status (Open, Coming)
        document.querySelectorAll('.filter-pill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                this.currentFilters.status = e.target.dataset.status;
                this.renderData();
            });
        });
    }

    async loadData() {
        try {
            this.showLoading(true);
            const apiUrl = `${CONFIG.SHEETS_TO_API.BASE_URL}/${CONFIG.SHEETS_TO_API.USER_KEY}/${encodeURIComponent(CONFIG.SHEETS_TO_API.SHEET_NAME)}`;
            
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            
            // Diagnostik Header
            if (data.data && data.data.length > 0) {
                console.log('🔍 HEADER DETECTED:', Object.keys(data.data[0]));
            }

            this.allData = this.processApiData(data.data);
            console.log(`✅ Loaded ${this.allData.length} items`);
            this.renderData();

        } catch (error) {
            console.error('Error:', error);
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    findValueByKey(record, searchKey) {
        if (record[searchKey] !== undefined) return record[searchKey];
        const keys = Object.keys(record);
        const foundKey = keys.find(k => k.trim().toUpperCase() === searchKey.trim().toUpperCase());
        return foundKey ? record[foundKey] : undefined;
    }

    processApiData(apiData) {
        if (!Array.isArray(apiData)) return [];
        
        return apiData.map((record) => {
            const clean = (key, fallback) => {
                const val = this.findValueByKey(record, key);
                if (!val || val.toString().trim() === '' || val.toString().trim() === '-') return fallback;
                return val.toString().trim();
            };

            // Skip baris kosong
            const values = Object.values(record);
            if (values.every(val => !val || val.toString().trim() === "")) return null;

            // MAPPING DATA GFORM BARU
            // Prioritas: JUDUL KEGIATAN -> Fallback: NAMA LOMBA
            const judul = clean('JUDUL KEGIATAN', clean('NAMA LOMBA', null));
            const penyelenggara = clean('PENYELENGGARA', null);
            
            if (!judul || !penyelenggara) return null;

            // Ambil Jenis Informasi (Lomba/Beasiswa/dll)
            // Default ke 'Lomba' jika kolom ini belum diisi di sheet lama
            let jenisInfo = clean('JENIS INFORMASI', 'Lomba'); 

            // Mapping Benefit
            let benefit = clean('BENEFIT / HADIAH', clean('HADIAH & PENGHARGAAN', 'Lihat detail'));

            let rawStatus = this.findValueByKey(record, 'STATUS_APPROVAL') || 'PENDING';

            const cleaned = {
                id: 'item_' + Math.random().toString(36).substr(2, 9),
                judul: judul,
                jenis: jenisInfo, // Ini kunci utamanya
                penyelenggara: penyelenggara,
                
                benefit: benefit,
                biaya: clean('BIAYA PENDAFTARAN', 'Gratis'),
                bidang: clean('BIDANG LOMBA', 'Umum'),
                
                tanggalMulai: clean('TANGGAL MULAI PENDAFTARAN', ''),
                deadline: clean('DEADLINE PENDAFTARAN', ''),
                
                link: clean('LINK PENDAFTARAN/RESMI', ''),
                kontak: clean('NARAHUBUNG', '-'),
                deskripsi: clean('DESKRIPSI SINGKAT LOMBA', 'Tidak ada deskripsi.'),
                
                statusApproval: rawStatus.toString().toUpperCase().trim()
            };

            cleaned.status = this.calculateStatus(cleaned.tanggalMulai, cleaned.deadline);
            cleaned.urgency = this.calculateUrgency(cleaned.deadline, cleaned.status);

            return cleaned;
        }).filter(r => r !== null);
    }

    filterData() {
        let filtered = this.allData;

        // 1. Filter Status Approved
        filtered = filtered.filter(item => item.statusApproval.includes('APPROVED'));

        // 2. Filter Kategori (Tab Menu)
        if (this.currentFilters.category !== 'all') {
            filtered = filtered.filter(item => 
                item.jenis.toLowerCase().includes(this.currentFilters.category.toLowerCase())
            );
        }

        // 3. Filter Search
        if (this.currentFilters.search) {
            const term = this.currentFilters.search.toLowerCase();
            filtered = filtered.filter(item => 
                item.judul.toLowerCase().includes(term) ||
                item.penyelenggara.toLowerCase().includes(term) ||
                item.jenis.toLowerCase().includes(term)
            );
        }

        // 4. Filter Status Waktu
        if (this.currentFilters.status !== 'all') {
            filtered = filtered.filter(item => item.status === this.currentFilters.status);
        }

        return filtered;
    }

    renderData() {
        const filteredData = this.filterData();
        const container = document.getElementById('lombaContainer');
        const noResults = document.getElementById('noResults');

        if (filteredData.length === 0) {
            container.style.display = 'none';
            noResults.style.display = 'block';
        } else {
            container.style.display = 'grid';
            noResults.style.display = 'none';
            container.innerHTML = this.generateCardsHTML(filteredData);
        }
    }

    generateCardsHTML(data) {
        return data.map(item => {
            // Ikon dinamis sesuai jenis
            let iconClass = 'fa-trophy';
            if (item.jenis.toLowerCase().includes('beasiswa')) iconClass = 'fa-graduation-cap';
            if (item.jenis.toLowerCase().includes('magang')) iconClass = 'fa-briefcase';
            if (item.jenis.toLowerCase().includes('seminar')) iconClass = 'fa-microphone';

            return `
            <div class="lomba-card" data-id="${item.id}">
                <div class="card-content"> 
                    <div class="card-header">
                        <span class="category-badge">
                            <i class="fas ${iconClass}"></i> ${item.jenis}
                        </span>
                        <span class="status-badge ${item.status}">
                            ${this.getStatusText(item.status)}
                        </span>
                    </div>
                    
                    <h3 class="card-title">${this.escapeHTML(item.judul)}</h3>
                    
                    <p class="organizer"><i class="fas fa-building"></i> ${this.escapeHTML(item.penyelenggara)}</p>
                    
                    <div class="info-row">
                        <span class="info-tag"><i class="fas fa-gift"></i> ${this.escapeHTML(item.benefit).substring(0,30)}...</span>
                        <span class="info-tag"><i class="fas fa-tag"></i> ${this.escapeHTML(item.biaya)}</span>
                    </div>
                    
                    ${item.urgency ? `<div class="urgency-bar ${item.urgency.class}">${item.urgency.badge}</div>` : ''}

                    <div class="deadline">
                        <span><i class="far fa-clock"></i> Deadline:</span>
                        <strong>${this.formatDate(item.deadline)}</strong>
                    </div>
                    
                    <div class="card-actions">
                        ${item.link ? 
                            `<a href="${this.escapeHTML(item.link)}" target="_blank" class="btn-primary">Buka Link</a>` :
                            `<button class="btn-primary" disabled>Link -</button>`
                        }
                        <button class="btn-secondary" onclick="app.showDetail('${item.id}')">Detail</button>
                    </div>
                </div> 
            </div>
        `}).join('');
    }

    // Modal Detail
    showDetail(itemId) {
        const item = this.allData.find(i => i.id === itemId);
        if (!item) return;

        const modalBody = document.getElementById('modalBody');
        
        // Ikon Besar
        let iconClass = 'fa-trophy';
        if (item.jenis.toLowerCase().includes('beasiswa')) iconClass = 'fa-graduation-cap';
        if (item.jenis.toLowerCase().includes('magang')) iconClass = 'fa-briefcase';
        if (item.jenis.toLowerCase().includes('seminar')) iconClass = 'fa-microphone';

        modalBody.innerHTML = `
            <div style="text-align:center; margin-bottom:1.5rem; color:var(--kse-blue);">
                <i class="fas ${iconClass}" style="font-size:3rem; margin-bottom:1rem;"></i>
                <h2 class="modal-title" style="margin-bottom:0.5rem;">${this.escapeHTML(item.judul)}</h2>
                <span class="category-badge">${item.jenis}</span>
            </div>
            
            <div class="modal-section">
                <h5><i class="fas fa-align-left"></i> Deskripsi</h5>
                <p>${this.escapeHTML(item.deskripsi)}</p>
            </div>
            
            <div class="modal-section">
                <h5><i class="fas fa-star"></i> Benefit / Info</h5>
                <p>${this.escapeHTML(item.benefit)}</p>
            </div>
            
            <div class="modal-section">
                <h5><i class="fas fa-info-circle"></i> Detail Lainnya</h5>
                <ul>
                    <li><i class="fas fa-building"></i> Penyelenggara: ${this.escapeHTML(item.penyelenggara)}</li>
                    <li><i class="fas fa-money-bill-wave"></i> Biaya: ${this.escapeHTML(item.biaya)}</li>
                    <li><i class="fas fa-calendar-alt"></i> Deadline: ${this.formatDate(item.deadline)}</li>
                    <li><i class="fas fa-user"></i> Kontak: ${this.escapeHTML(item.kontak)}</li>
                </ul>
            </div>
            
            ${item.link ? 
                `<a href="${this.escapeHTML(item.link)}" target="_blank" class="btn-primary" style="width:100%; display:block; margin-top:1rem; text-align:center; padding:1rem;">Buka Link Pendaftaran/Info</a>` : ''}
        `;
        
        document.getElementById('detailModal').style.display = 'flex';
        setTimeout(() => document.getElementById('detailModal').classList.add('show'), 10);
    }

    closeDetailModal() {
        const modal = document.getElementById('detailModal');
        modal.classList.remove('show');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }

    showLoading(show) {
        document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
        document.getElementById('lombaContainer').style.display = show ? 'none' : 'grid';
    }

    showError(msg) {
        document.getElementById('lombaContainer').innerHTML = `<div class="error-state"><p>${msg}</p></div>`;
        document.getElementById('lombaContainer').style.display = 'block';
    }

    // Helpers
    parseDate(d) { if(!d)return null; const p=d.split('/'); if(p.length===3)return new Date(`${p[2]}-${p[1]}-${p[0]}`); return new Date(d); }
    calculateStatus(s, e) { const now=new Date(); const end=this.parseDate(e); if(!end)return 'unknown'; if(now>end)return 'closed'; const start=this.parseDate(s); if(start&&now<start)return 'coming'; return 'open'; }
    calculateUrgency(d, s) { if(s!=='open'||!d)return null; const now=new Date(); const end=this.parseDate(d); if(!end)return null; const days=Math.ceil((end-now)/8.64e7); 
        if(days<=0)return {badge:"HARI INI TERAKHIR!",class:"urgent-critical"};
        if(days<=3)return {badge:`${days} HARI LAGI`,class:"urgent"};
        return null;
    }
    getStatusText(s) { const t={'open':'Buka','coming':'Segera','closed':'Tutup','unknown':''}; return t[s]||''; }
    formatDate(d) { try{const date=this.parseDate(d); return date?date.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}):d;}catch(e){return d;} }
    escapeHTML(t) { if(!t)return ''; const d=document.createElement('div'); d.textContent=t; return d.innerHTML; }
    debounce(f,w) { let t; return(...a)=>{ clearTimeout(t); t=setTimeout(()=>f.apply(this,a),w); }; }
}
document.addEventListener('DOMContentLoaded', () => { window.app = new InfoLombaApp(); });
