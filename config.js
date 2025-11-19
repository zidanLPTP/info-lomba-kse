const CONFIG = {
    // Sheets to API Configuration - MUDAH BANGET!
    SHEETS_TO_API: {
        USER_KEY: 'cc639a18-b272-42e0-87b0-c24a8227b37d',
        SHEET_NAME: 'Form Responses 1',
        BASE_URL: 'https://sheets.livepolls.app/api/spreadsheets'
    },

    // Website Settings
    WEBSITE: {
        TITLE: 'Info Lomba KSE',
        DESCRIPTION: 'Portal Informasi Lomba Terlengkap untuk Mahasiswa',
        THEME: {
            primary: '#2563eb',
            secondary: '#1e40af',
            accent: '#f59e0b'
        }
    },

    // Auto-Urgency Settings (Hari)
    URGENCY_SETTINGS: {
        CRITICAL: 1,    // ≤ 1 hari: TUTUP HARI INI!
        URGENT: 3,      // ≤ 3 hari: TUTUP SEGERA
        HOT: 7          // ≤ 7 hari: BURUAN!
    },

    // Filter Options
    FILTER_OPTIONS: {
        STATUS: ['all', 'open', 'coming', 'closed'],
        CATEGORIES: ['all', 'Internasional', 'Nasional', 'Regional'],
        TYPES: ['all', 'Individu', 'Kelompok']
    }
};

// Export untuk penggunaan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}