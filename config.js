const CONFIG = {
    // Sheets to API Configuration 
    SHEETS_TO_API: {
        USER_KEY: '0bef18ec-958a-4d4d-8353-d5de4dcd2e6d',
        SHEET_NAME: 'Form Responses 1',
        BASE_URL: 'https://sheets.livepolls.app/api/spreadsheets'
    },

    WEBSITE: {
        TITLE: 'Info Lomba KSE',
        DESCRIPTION: 'Portal Informasi Lomba Terlengkap untuk Mahasiswa',
        THEME: {
            primary: '#2563eb',
            secondary: '#1e40af',
            accent: '#f59e0b'
        }
    },

    URGENCY_SETTINGS: {
        CRITICAL: 1,  
        URGENT: 3,    
        HOT: 7      
    },


    FILTER_OPTIONS: {
        STATUS: ['all', 'open', 'coming', 'closed'],
        CATEGORIES: ['all', 'Internasional', 'Nasional', 'Regional'],
        TYPES: ['all', 'Individu', 'Kelompok']
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}