/**
 * KSEUnriPedia - Advanced Admin Parser
 * Intelligent text extraction dan real-time parsing untuk data Lomba/Karir/Seminar
 */

class AdvancedAdminParser {
    constructor() {
        this.rawText = '';
        this.parsedData = {};
        this.parsePatterns = {
            judul: {
                keywords: ['judul', 'nama', 'title', 'kompetisi', 'lomba', 'posisi', 'jenis', 'kegiatan'],
                confidence: 0
            },
            penyelenggara: {
                keywords: ['penyelenggara', 'organizer', 'perusahaan', 'institusi', 'universitas', 'oleh'],
                confidence: 0
            },
            deadline: {
                keywords: ['deadline', 'batas akhir', 'tutup', 'pendaftaran ditutup', 'sampai', 'hingga', 'akhir'],
                confidence: 0
            },
            tanggal_mulai: {
                keywords: ['mulai', 'dibuka', 'registrasi', 'pendaftaran dibuka', 'dari']
            },
            benefit: {
                keywords: ['hadiah', 'benefit', 'prize', 'juara', 'pemenang', 'reward'],
                confidence: 0
            },
            link: {
                keywords: ['link', 'daftar', 'register', 'mendaftar', 'bit.ly', 'linktr.ee', 'forms.gle'],
                confidence: 0
            },
            kontak: {
                pattern: /(?:\+62|08|62)\d{2,4}[\s\-]*\d{3,4}[\s\-]*\d{3,5}/g
            },
            email: {
                pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
            }
        };

        this.init();
    }

    init() {
        const rawTextArea = document.getElementById('rawText');
        const btnEksekusi = document.getElementById('btnEksekusi');

        // Check URL parameters untuk prefill dari popup
        this.handlePrefillFromURL();

        if (rawTextArea) {
            // Real-time feedback saat user mengetik
            rawTextArea.addEventListener('input', (e) => {
                this.rawText = e.target.value;
                this.updateParsingFeedback();
            });

            // Paste event untuk deteksi paste
            rawTextArea.addEventListener('paste', (e) => {
                setTimeout(() => {
                    this.rawText = rawTextArea.value;
                    this.updateParsingFeedback();
                }, 100);
            });
        }

        if (btnEksekusi) {
            btnEksekusi.addEventListener('click', () => {
                this.executeAdvancedParsing();
            });
        }

        this.setupFormAutoFill();
    }

    /**
     * Handle prefill dari URL parameter (dari popup)
     */
    handlePrefillFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const prefill = urlParams.get('prefill');

        if (prefill) {
            const rawTextArea = document.getElementById('rawText');
            if (rawTextArea) {
                // Decode dan set nilai
                const decodedText = decodeURIComponent(prefill);
                rawTextArea.value = decodedText;
                this.rawText = decodedText;

                // Update parsing feedback
                this.updateParsingFeedback();

                // Auto-scroll ke textarea
                setTimeout(() => {
                    rawTextArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);

                // Auto-parse setelah 0.5 detik
                setTimeout(() => {
                    this.executeAdvancedParsing();
                }, 500);

                // Clean URL (remove parameter)
                const cleanUrl = window.location.pathname + window.location.hash;
                window.history.replaceState({}, document.title, cleanUrl);

                // Show info toast
                this.showToast('📲 Data dari popup berhasil dimuat! Parsing otomatis dimulai...', 'info');
            }
        }
    }

    /**
     * Update visual feedback saat user mengetik/paste
     */
    updateParsingFeedback() {
        if (!this.rawText.trim()) {
            this.hideParseFeedback();
            return;
        }

        const feedback = this.analyzePotentialData();
        this.displayFeedback(feedback);
    }

    /**
     * Analisis teks untuk mendeteksi field yang bisa diekstrak
     */
    analyzePotentialData() {
        const lines = this.rawText.split('\n').filter(l => l.trim());
        const analysis = {
            estimatedFields: [],
            dataQuality: 0,
            warnings: []
        };

        // 1. Deteksi Tanggal  
        const dateMatches = this.detectDates();
        if (dateMatches.length >= 2) {
            analysis.estimatedFields.push({ name: 'Tanggal Mulai & Deadline', icon: '📅' });
            analysis.dataQuality += 25;
        } else if (dateMatches.length === 1) {
            analysis.estimatedFields.push({ name: 'Deadline', icon: '📅' });
            analysis.dataQuality += 15;
        } else {
            analysis.warnings.push('⚠️ Tidak ada tanggal ditemukan');
        }

        // 2. Deteksi Link
        const links = this.detectLinks();
        if (links.length > 0) {
            analysis.estimatedFields.push({ name: 'Link Pendaftaran', icon: '🔗' });
            analysis.dataQuality += 20;
        } else {
            analysis.warnings.push('⚠️ Tidak ada link pendaftaran');
        }

        // 3. Deteksi Kontak
        const kontaks = this.detectPhoneEmail();
        if (kontaks.phones.length > 0 || kontaks.emails.length > 0) {
            analysis.estimatedFields.push({ name: 'Narahubung', icon: '📞' });
            analysis.dataQuality += 15;
        }

        // 4. Deteksi Judul (biasanya 1-2 line pertama)
        if (lines.length > 0) {
            const firstLine = lines[0].trim();
            if (firstLine.length > 5 && firstLine.length < 200) {
                analysis.estimatedFields.push({ name: 'Judul Kegiatan', icon: '✏️' });
                analysis.dataQuality += 15;
            }
        }

        // 5. Deteksi Penyelenggara (cari keyword atau entity)
        if (this.containsKeyword(['oleh', 'dari', 'penyelenggara', 'organizer'])) {
            analysis.estimatedFields.push({ name: 'Penyelenggara', icon: '🏢' });
            analysis.dataQuality += 10;
        }

        // 6. Deteksi Benefit/Hadiah
        if (this.containsKeyword(['hadiah', 'benefit', 'juara', 'pemenang', 'reward'])) {
            analysis.estimatedFields.push({ name: 'Hadiah/Benefit', icon: '🎁' });
            analysis.dataQuality += 10;
        }

        return analysis;
    }

    /**
     * Helper: Deteksi Keywords
     */
    containsKeyword(keywords) {
        const textLower = this.rawText.toLowerCase();
        return keywords.some(keyword => textLower.includes(keyword));
    }

    /**
     * Deteksi Tanggal dalam berbagai format
     */
    detectDates() {
        const text = this.rawText;

        // Pattern: DD-Month-YYYY, DD/Month/YYYY, Month DD YYYY, dll
        const datePatterns = [
            /\d{1,2}[\-\/\s]+(?:januari|february|pebruari|februari|maret|march|april|mei|may|juni|june|juli|july|agustus|august|september|oktober|october|november|desember|december)[\-\/\s]+\d{4}/gi,
            /\d{1,2}[\-\/\.]\d{1,2}[\-\/\.]\d{4}/g,
            /(?:januari|february|pebruari|februari|maret|march|april|mei|may|juni|june|juli|july|agustus|august|september|oktober|october|november|desember|december)\s+\d{1,2}[\s,]*\d{4}/gi
        ];

        let matches = [];
        datePatterns.forEach(pattern => {
            const found = text.match(pattern);
            if (found) {
                matches = matches.concat(found);
            }
        });

        return [...new Set(matches)]; // Remove duplicates
    }

    /**
     * Deteksi Link Pendaftaran
     */
    detectLinks() {
        const urlPattern = /(https?:\/\/(?:www\.)?(?:bit\.ly|linktr\.ee|docs\.google\.com\/forms|tinyurl|short\.link)[^\s]+)/gi;
        return this.rawText.match(urlPattern) || [];
    }

    /**
     * Deteksi Kontak (Phone & Email)
     */
    detectPhoneEmail() {
        const phonePattern = /(?:\+62|08|62)\d{2,4}[\s\-]*\d{3,4}[\s\-]*\d{3,5}/g;
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

        return {
            phones: this.rawText.match(phonePattern) || [],
            emails: this.rawText.match(emailPattern) || []
        };
    }

    /**
     * Tampilkan visual feedback
     */
    displayFeedback(analysis) {
        let feedbackHTML = document.getElementById('parsingFeedback');

        if (!feedbackHTML) {
            feedbackHTML = document.createElement('div');
            feedbackHTML.id = 'parsingFeedback';
            feedbackHTML.style.cssText = `
                margin-bottom: 1rem;
                padding: 1rem;
                border-radius: 10px;
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border-left: 4px solid #3b82f6;
                animation: slideIn 0.3s ease;
            `;
            const rawTextArea = document.getElementById('rawText');
            if (rawTextArea && rawTextArea.parentNode) {
                rawTextArea.parentNode.insertBefore(feedbackHTML, rawTextArea);
            }
        }

        // Quality Bar
        let qualityColor = '#ef4444';
        if (analysis.dataQuality >= 70) qualityColor = '#10b981';
        else if (analysis.dataQuality >= 50) qualityColor = '#f59e0b';

        let content = `
            <div style="margin-bottom: 0.75rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem;">
                    <span><strong>Data Quality</strong></span>
                    <span style="color: ${qualityColor}; font-weight: bold;">${analysis.dataQuality}%</span>
                </div>
                <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; width: ${analysis.dataQuality}%; background: ${qualityColor}; transition: width 0.3s ease;"></div>
                </div>
            </div>
        `;

        if (analysis.estimatedFields.length > 0) {
            content += `
                <div style="margin-bottom: 0.75rem;">
                    <strong style="font-size: 0.9rem; color: #1e40af;">🔍 Field yang Terdeteksi:</strong>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 0.5rem;">
            `;
            analysis.estimatedFields.forEach(field => {
                content += `
                    <span style="
                        display: inline-block;
                        background: white;
                        padding: 0.3rem 0.8rem;
                        border-radius: 20px;
                        font-size: 0.85rem;
                        border: 1px solid #cbd5e1;
                        color: #1e40af;
                    ">
                        ${field.icon} ${field.name}
                    </span>
                `;
            });
            content += `</div></div>`;
        }

        if (analysis.warnings.length > 0) {
            content += `
                <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #cbd5e1;">
                    <strong style="font-size: 0.9rem; color: #f59e0b;">Saran:</strong>
                    <ul style="margin: 0.3rem 0 0 1.2rem; font-size: 0.85rem; color: #64748b;">
            `;
            analysis.warnings.forEach(warning => {
                content += `<li>${warning}</li>`;
            });
            content += `</ul></div>`;
        }

        feedbackHTML.innerHTML = content;
    }

    /**
     * Sembunyikan feedback
     */
    hideParseFeedback() {
        const feedback = document.getElementById('parsingFeedback');
        if (feedback) {
            feedback.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => feedback.remove(), 300);
        }
    }

    /**
     * Eksekusi advanced parsing
     */
    async executeAdvancedParsing() {
        if (!this.rawText.trim()) {
            alert('⚠️ Teks kosong! Silakan paste teks terlebih dahulu.');
            return;
        }

        // Tampilkan loading state
        const btnEksekusi = document.getElementById('btnEksekusi');
        const originalHTML = btnEksekusi.innerHTML;
        btnEksekusi.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sedang parsing...';
        btnEksekusi.disabled = true;

        try {
            // Simulasi processing delay untuk UX yang lebih baik
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Lakukan parsing
            const extracted = this.smartExtractData();

            // Auto-fill form dengan data yang diekstrak
            this.autoFillForm(extracted);

            // Smooth scroll ke form
            const formCard = document.querySelector('.card-header');
            if (formCard) {
                formCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            // Tampilkan success toast
            this.showToast('✅ Data berhasil diekstrak! Periksa dan edit jika diperlukan.', 'success');

        } catch (error) {
            console.error('Parsing error:', error);
            this.showToast('❌ Gagal parsing data: ' + error.message, 'error');
        } finally {
            btnEksekusi.innerHTML = originalHTML;
            btnEksekusi.disabled = false;
        }
    }

    /**
     * Smart extraction data dari text
     */
    smartExtractData() {
        const lines = this.rawText.split('\n').map(l => l.trim()).filter(l => l);

        const extracted = {
            judul: '',
            penyelenggara: '',
            tanggal_mulai: '',
            deadline: '',
            benefit: '',
            link: '',
            kontak: '',
            deskripsi: ''
        };

        // 1. Ekstrak Judul (biasanya line pertama yang panjang)
        if (lines.length > 0) {
            const firstLine = lines[0];
            if (firstLine.length > 5 && firstLine.length < 200 && !firstLine.includes('📱')) {
                extracted.judul = this.cleanText(firstLine);
            }
        }

        // 2. Ekstrak Tanggal
        const dates = this.detectDates();
        if (dates.length >= 2) {
            extracted.tanggal_mulai = this.parseDate(dates[0]);
            extracted.deadline = this.parseDate(dates[dates.length - 1]);
        } else if (dates.length === 1) {
            extracted.deadline = this.parseDate(dates[0]);
        }

        // 3. Ekstrak Link
        const links = this.detectLinks();
        if (links.length > 0) {
            extracted.link = links[0];
        }

        // 4. Ekstrak Kontak
        const kontaks = this.detectPhoneEmail();
        if (kontaks.phones.length > 0) {
            extracted.kontak = kontaks.phones[0];
        } else if (kontaks.emails.length > 0) {
            extracted.kontak = kontaks.emails[0];
        }

        // 5. Ekstrak Penyelenggara (cari setelah keyword 'oleh', 'dari')
        const orgMatch = this.rawText.match(/(?:oleh|dari|penyelenggara|organizer|by|bersama)\s+([A-Z][^,.]*)/i);
        if (orgMatch) {
            extracted.penyelenggara = this.cleanText(orgMatch[1]);
        }

        // 6. Ekstrak Benefit (cari setelah keyword 'hadiah', 'benefit')
        const benefitMatch = this.rawText.match(/(?:hadiah|benefit|prize|reward|pemenang)\s*[:\-]?\s*([^,.\n]+)/i);
        if (benefitMatch) {
            extracted.benefit = this.cleanText(benefitMatch[1]);
        }

        // 7. Deskripsi (ambil 150 char pertama)
        const fullText = this.rawText.replace(/\n+/g, ' ');
        extracted.deskripsi = this.cleanText(fullText).substring(0, 150) + '...';

        return extracted;
    }

    /**
     * Parse date string ke format YYYY-MM-DD
     */
    parseDate(dateString) {
        const months = {
            'januari': '01', 'january': '01',
            'pebruari': '02', 'februari': '02', 'february': '02',
            'maret': '03', 'march': '03',
            'april': '04',
            'mei': '05', 'may': '05',
            'juni': '06', 'june': '06',
            'juli': '07', 'july': '07',
            'agustus': '08', 'august': '08',
            'september': '09',
            'oktober': '10', 'october': '10',
            'november': '11',
            'desember': '12', 'december': '12'
        };

        let cleaned = dateString.toLowerCase().trim();

        // Try DD-MONTH-YYYY format
        for (const [monthName, monthNum] of Object.entries(months)) {
            const regex = new RegExp(`(\\d{1,2})\\s*[-/]\\s*${monthName}\\s*[-/]\\s*(\\d{4})`, 'i');
            const match = cleaned.match(regex);
            if (match) {
                const day = String(match[1]).padStart(2, '0');
                const year = match[2];
                return `${year}-${monthNum}-${day}`;
            }
        }

        // Try DD/MM/YYYY or DD-MM-YYYY format
        const slashMatch = cleaned.match(/(\d{1,2})[\-\/](\d{1,2})[\-\/](\d{4})/);
        if (slashMatch) {
            const day = String(slashMatch[1]).padStart(2, '0');
            const month = String(slashMatch[2]).padStart(2, '0');
            const year = slashMatch[3];
            return `${year}-${month}-${day}`;
        }

        return '';
    }

    /**
     * Clean text dari emoji dan special chars
     */
    cleanText(text) {
        return text
            .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emoji
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Auto-fill form dengan extracted data
     */
    autoFillForm(data) {
        const fieldMapping = {
            'entryJudul': data.judul,
            'entryPenyelenggara': data.penyelenggara,
            'entryMulai': data.tanggal_mulai,
            'entryDeadline': data.deadline,
            'entryBenefit': data.benefit,
            'entryLink': data.link,
            'entryKontak': data.kontak,
            'entryDeskripsi': data.deskripsi
        };

        Object.entries(fieldMapping).forEach(([elementId, value]) => {
            const element = document.getElementById(elementId);
            if (element && value) {
                element.value = value;
                // Trigger change event untuk form validation
                element.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }

    /**
     * Toast Notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';

        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 9999;
            animation: slideIn 0.3s ease;
            font-weight: 600;
        `;

        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    /**
     * Setup auto-fill untuk form changes
     */
    setupFormAutoFill() {
        const formInputs = document.querySelectorAll('#submissionForm input, #submissionForm textarea, #submissionForm select');

        formInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                // Visual indicator bahwa field sudah diisi
                if (e.target.value) {
                    e.target.style.borderColor = '#10b981';
                }
            });
        });
    }
}

// Inisialisasi class saat DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdvancedAdminParser();
});

// Inject CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(10px);
        }
    }

    .parsing-feedback-success {
        background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%) !important;
        border-left-color: #10b981 !important;
    }

    .parsing-feedback-warning {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%) !important;
        border-left-color: #f59e0b !important;
    }
`;
document.head.appendChild(style);
