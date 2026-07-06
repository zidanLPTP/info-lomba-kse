/**
 * KSEUNRIPedia Admin Dashboard Analytics Script
 * Powered by Chart.js & Google Sheets GViz API
 */

class AdminDashboard {
    constructor() {
        this.allData = [];
        this.charts = {};
        this.init();
    }

    async init() {
        try {
            console.log('📊 Initializing Admin Dashboard Analytics...');
            await this.loadData();
            this.renderStats();
            this.renderCharts();
            
            // Perbarui visual spinner sinkronisasi
            const spinner = document.getElementById('syncSpinner');
            if (spinner) {
                spinner.classList.remove('fa-spin');
                spinner.classList.replace('fa-sync', 'fa-check');
                spinner.parentElement.classList.replace('bg-primary', 'bg-success');
                spinner.parentElement.innerHTML = '<i class="fas fa-check me-1"></i> Terhubung';
            }
        } catch (error) {
            console.error('❌ Gagal memuat dashboard analitik:', error);
            const spinner = document.getElementById('syncSpinner');
            if (spinner) {
                spinner.classList.remove('fa-spin');
                spinner.classList.replace('fa-sync', 'fa-times');
                spinner.parentElement.classList.replace('bg-primary', 'bg-danger');
                spinner.parentElement.innerHTML = '<i class="fas fa-times me-1"></i> Gagal Sinkron';
            }
        }
    }

    async loadData() {
        const sheetId = CONFIG.GOOGLE_SHEET.SHEET_ID;
        const sheetName = CONFIG.GOOGLE_SHEET.SHEET_NAME;
        const apiUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const text = await response.text();
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error('Format data Google Sheets tidak valid.');
        }
        
        const jsonString = text.substring(jsonStart, jsonEnd + 1);
        const rawData = JSON.parse(jsonString);
        
        if (rawData.status !== 'ok') {
            throw new Error('Gagal mengambil data dari Google Sheets.');
        }

        const table = rawData.table;
        const cols = table.cols.map(col => col.label || col.id);
        this.allData = table.rows.map(row => {
            const item = {};
            row.c.forEach((cell, index) => {
                const colName = cols[index];
                if (colName) {
                    item[colName] = cell ? (cell.f !== undefined ? cell.f : cell.v) : null;
                }
            });
            return item;
        }).filter(item => {
            // Saring baris yang benar-benar kosong
            const values = Object.values(item);
            return !values.every(val => !val || val.toString().trim() === "");
        });
    }

    findValueByKey(record, searchKey) {
        if (record[searchKey] !== undefined) return record[searchKey];
        const keys = Object.keys(record);
        const foundKey = keys.find(k => k.trim().toUpperCase() === searchKey.trim().toUpperCase());
        return foundKey ? record[foundKey] : undefined;
    }

    renderStats() {
        const total = this.allData.length;
        let countLomba = 0;
        let countKarir = 0;
        let countSeminar = 0;

        this.allData.forEach(record => {
            let jenis = this.findValueByKey(record, 'JENIS INFORMASI') || 'Lomba';
            jenis = jenis.toString().toLowerCase();

            if (jenis.includes('lomba')) {
                countLomba++;
            } else if (jenis.includes('magang') || jenis.includes('loker') || jenis.includes('lowongan') || jenis.includes('karir')) {
                countKarir++;
            } else if (jenis.includes('seminar')) {
                countSeminar++;
            }
        });

        // Update teks statistik di HTML
        document.getElementById('statTotal').innerText = total;
        document.getElementById('statLomba').innerText = countLomba;
        document.getElementById('statKarir').innerText = countKarir;
        document.getElementById('statSeminar').innerText = countSeminar;
    }

    renderCharts() {
        const categoryCounts = {};
        const bidangCounts = {
            'Akademik & Bahasa': 0,
            'Teknologi & Digital': 0,
            'Seni & Budaya': 0,
            'Bisnis & Kewirausahaan': 0,
            'Bela Diri & Olahraga': 0
        };
        let gratisCount = 0;
        let berbayarCount = 0;

        this.allData.forEach(record => {
            // 1. Kategori Informasi
            let jenis = this.findValueByKey(record, 'JENIS INFORMASI') || 'Lomba';
            jenis = jenis.toString().trim();
            if (jenis) {
                // Standarisasi label
                if (jenis.toLowerCase().includes('lowongan kerja') || jenis.toLowerCase().includes('loker')) {
                    jenis = 'Lowongan Kerja';
                }
                categoryCounts[jenis] = (categoryCounts[jenis] || 0) + 1;
            }

            // 2. Bidang Lomba (Khusus Lomba)
            if (jenis.toLowerCase().includes('lomba')) {
                let bidang = this.findValueByKey(record, 'BIDANG LOMBA') || 'Akademik & Bahasa';
                bidang = bidang.toString().trim();
                if (bidangCounts[bidang] !== undefined) {
                    bidangCounts[bidang]++;
                } else {
                    // Cari pencocokan parsial jika ada deviasi teks
                    const matchedKey = Object.keys(bidangCounts).find(k => k.toLowerCase().includes(bidang.toLowerCase()) || bidang.toLowerCase().includes(k.toLowerCase()));
                    if (matchedKey) {
                        bidangCounts[matchedKey]++;
                    } else {
                        bidangCounts['Akademik & Bahasa']++; // Default fallback
                    }
                }
            }

            // 3. Biaya Pendaftaran (Semua Kategori)
            let biaya = this.findValueByKey(record, 'BIAYA PENDAFTARAN') || 'Gratis';
            biaya = biaya.toString().trim().toLowerCase();
            if (biaya.includes('gratis') || biaya === 'free') {
                gratisCount++;
            } else {
                berbayarCount++;
            }
        });

        // --- CHART 1: PROPORSI KATEGORI ---
        const catLabels = Object.keys(categoryCounts);
        const catData = Object.values(categoryCounts);
        const catColors = [
            '#003366', // KSE Blue - Lomba
            '#10b981', // Emerald - Magang
            '#fbbf24', // KSE Gold - Seminar
            '#8b5cf6', // Violet - Loker
            '#ec4899', // Pink - Beasiswa
            '#64748b'  // Slate - Lainnya
        ];

        const ctxCat = document.getElementById('categoryChart').getContext('2d');
        this.charts.category = new Chart(ctxCat, {
            type: 'doughnut',
            data: {
                labels: catLabels,
                datasets: [{
                    data: catData,
                    backgroundColor: catColors.slice(0, catLabels.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                family: 'Plus Jakarta Sans',
                                size: 11,
                                weight: 600
                            },
                            padding: 10,
                            usePointStyle: true
                        }
                    }
                },
                cutout: '65%'
            }
        });

        // --- CHART 2: BIAYA PENDAFTARAN ---
        const ctxPrice = document.getElementById('priceChart').getContext('2d');
        this.charts.price = new Chart(ctxPrice, {
            type: 'pie',
            data: {
                labels: ['Gratis', 'Berbayar'],
                datasets: [{
                    data: [gratisCount, berbayarCount],
                    backgroundColor: ['#10b981', '#ef4444'], // Hijau (Gratis), Merah (Berbayar)
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                family: 'Plus Jakarta Sans',
                                size: 11,
                                weight: 600
                            },
                            padding: 10,
                            usePointStyle: true
                        }
                    }
                }
            }
        });

        // --- CHART 3: DISTRIBUSI BIDANG LOMBA ---
        const bidangLabels = Object.keys(bidangCounts);
        const bidangData = Object.values(bidangCounts);

        const ctxField = document.getElementById('fieldChart').getContext('2d');
        this.charts.field = new Chart(ctxField, {
            type: 'bar',
            data: {
                labels: bidangLabels.map(l => l.split(' & ')), // Pisah baris label panjang agar rapi
                datasets: [{
                    label: 'Jumlah Lomba',
                    data: bidangData,
                    backgroundColor: '#fbbf24', // Gold KSE
                    borderColor: '#d97706',
                    borderWidth: 1.5,
                    borderRadius: 6,
                    barThickness: 20
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: {
                                family: 'Plus Jakarta Sans',
                                weight: 600
                            }
                        },
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                family: 'Plus Jakarta Sans',
                                size: 9,
                                weight: 700
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// Tab Switcher & Inisialisasi Dashboard
document.addEventListener('DOMContentLoaded', () => {
    // 1. Logika Tab Switcher
    const btnTabStatistik = document.getElementById('btnTabStatistik');
    const btnTabInputManual = document.getElementById('btnTabInputManual');
    const viewStatistik = document.getElementById('viewStatistik');
    const viewInputManual = document.getElementById('viewInputManual');

    if (btnTabStatistik && btnTabInputManual && viewStatistik && viewInputManual) {
        btnTabStatistik.addEventListener('click', () => {
            btnTabStatistik.classList.add('active');
            btnTabInputManual.classList.remove('active');
            viewStatistik.classList.remove('d-none');
            viewInputManual.classList.add('d-none');
        });

        btnTabInputManual.addEventListener('click', () => {
            btnTabInputManual.classList.add('active');
            btnTabStatistik.classList.remove('active');
            viewInputManual.classList.remove('d-none');
            viewStatistik.classList.add('d-none');
        });
    }

    // 2. Cek Otentikasi sebelum memuat dashboard
    const checkAuthInterval = setInterval(() => {
        if (sessionStorage.getItem('admin_auth') === 'true') {
            clearInterval(checkAuthInterval);
            window.dashboard = new AdminDashboard();
        }
    }, 500);
});
