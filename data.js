// =============================================
// DATA STRUCTURE & UTILITY FUNCTIONS
// =============================================

class LombaDataManager {
    constructor() {
        this.allData = [];
        this.filteredData = [];
        this.currentFilters = {
            search: '',
            status: 'all',
            category: 'all',
            type: 'all'
        };
    }

    // Process data dari Google Sheets
    processSheetData(sheetData) {
        console.log('📊 Processing sheet data:', sheetData);
        
        if (!sheetData || !sheetData.values || sheetData.values.length < 2) {
            console.warn('❌ No data found in sheet');
            return [];
        }

        const headers = sheetData.values[0];
        const rows = sheetData.values.slice(1);
        
        console.log('📋 Headers:', headers);
        console.log('📝 Rows count:', rows.length);

        const processedData = rows.map((row, index) => {
            try {
                const record = {};
                
                // Map each column to its header
                headers.forEach((header, colIndex) => {
                    record[header] = row[colIndex] || '';
                });

                // Process and clean the data
                return this.cleanRecordData(record);
            } catch (error) {
                console.error(`❌ Error processing row ${index}:`, error);
                return null;
            }
        }).filter(record => record !== null);

        console.log('✅ Processed data:', processedData);
        return processedData;
    }

    // Clean and structure record data
    cleanRecordData(record) {
        const cleaned = {
            // Basic Info
            id: this.generateId(),
            namaLomba: record['Nama Lomba'] || 'Tidak ada nama',
            kategori: record['Kategori'] || 'Tidak ada kategori',
            jenisPartisipasi: record['Jenis Partisipasi'] || 'Tidak ada jenis',
            levelPeserta: record['Tingkat Peserta'] || 'Tidak ada level',
            
            // Details
            penyelenggara: record['Penyelenggara'] || 'Tidak ada penyelenggara',
            hadiah: record['Hadiah & Penghargaan'] || 'Tidak ada hadiah',
            biaya: record['Biaya Pendaftaran'] || 'Tidak diketahui',
            
            // Dates
            tanggalMulai: record['Tanggal Mulai Pendaftaran'] || '',
            deadline: record['Batas Akhir Pendaftaran'] || '',
            
            // Contact & Links
            linkPendaftaran: record['Link Pendaftaran/Resmi'] || '',
            linkPoster: record['Link Poster/Flyer'] || '',
            contactPerson: record['Narahubung'] || 'Tidak ada kontak',
            emailWebsite: record['Email/Website Resmi'] || '',
            
            // Additional Info
            deskripsi: record['Deskripsi Singkat Lomba'] || '',
            inputBy: record['Nama yang Menginput Data'] || 'Anonim',
            asalHimpunan: record['Asal Jurusan/Himpunan'] || '',
            
            // System Fields
            statusApproval: record['STATUS_APPROVAL'] || 'PENDING',
            timestamp: record['Timestamp'] || new Date().toISOString()
        };

        // Calculate derived fields
        cleaned.status = this.calculateStatus(cleaned.tanggalMulai, cleaned.deadline);
        cleaned.urgency = this.calculateUrgency(cleaned.deadline, cleaned.status);
        cleaned.simplifiedHadiah = this.simplifyHadiah(cleaned.hadiah);

        return cleaned;
    }

    // Calculate status based on dates
    calculateStatus(tanggalMulai, deadline) {
        const now = new Date();
        const startDate = new Date(tanggalMulai);
        const endDate = new Date(deadline);

        if (!deadline) return 'unknown';
        if (now > endDate) return 'closed';
        if (now < startDate) return 'coming';
        return 'open';
    }

    // Calculate urgency badge
    calculateUrgency(deadline, status) {
        if (status !== 'open' || !deadline) return null;

        const now = new Date();
        const endDate = new Date(deadline);
        const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) return null;
        if (daysLeft === 0) return { badge: "⏰ TUTUP HARI INI!", class: "urgent-critical" };
        if (daysLeft <= 1) return { badge: "🚨 BESOK TUTUP!", class: "urgent-critical" };
        if (daysLeft <= 3) return { badge: "⏰ TUTUP SEGERA", class: "urgent" };
        if (daysLeft <= 7) return { badge: "🔥 BURUAN!", class: "hot" };
        
        return null;
    }

    // Simplify hadiah text for card display
    simplifyHadiah(hadiahText) {
        if (!hadiahText) return 'Tidak ada informasi hadiah';
        
        // Extract first sentence or key information
        const firstSentence = hadiahText.split('.')[0];
        if (firstSentence.length <= 100) return firstSentence;
        
        // If too long, take first 100 chars
        return hadiahText.substring(0, 100) + '...';
    }

    // Generate unique ID
    generateId() {
        return 'lomba_' + Math.random().toString(36).substr(2, 9);
    }

    // Filter data based on current filters
    filterData() {
        let filtered = this.allData;

        // Filter by search term
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filtered = filtered.filter(item => 
                item.namaLomba.toLowerCase().includes(searchTerm) ||
                item.penyelenggara.toLowerCase().includes(searchTerm) ||
                item.kategori.toLowerCase().includes(searchTerm) ||
                item.deskripsi.toLowerCase().includes(searchTerm)
            );
        }

        // Filter by status
        if (this.currentFilters.status !== 'all') {
            filtered = filtered.filter(item => item.status === this.currentFilters.status);
        }

        // Filter by category
        if (this.currentFilters.category !== 'all') {
            filtered = filtered.filter(item => item.kategori === this.currentFilters.category);
        }

        // Filter by type
        if (this.currentFilters.type !== 'all') {
            filtered = filtered.filter(item => item.jenisPartisipasi === this.currentFilters.type);
        }

        // Only show approved items
        filtered = filtered.filter(item => item.statusApproval === 'APPROVED');

        this.filteredData = filtered;
        return filtered;
    }

    // Update filters
    updateFilters(newFilters) {
        this.currentFilters = { ...this.currentFilters, ...newFilters };
        return this.filterData();
    }

    // Get filter counts for UI
    getFilterCounts() {
        const counts = {
            all: this.allData.filter(item => item.statusApproval === 'APPROVED').length,
            open: this.allData.filter(item => item.status === 'open' && item.statusApproval === 'APPROVED').length,
            coming: this.allData.filter(item => item.status === 'coming' && item.statusApproval === 'APPROVED').length,
            closed: this.allData.filter(item => item.status === 'closed' && item.statusApproval === 'APPROVED').length
        };
        return counts;
    }
}

// Create global instance
const dataManager = new LombaDataManager();