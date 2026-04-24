const CONFIG = {
    SHEETS_TO_API: {
        USER_KEY: '4620808b-aa88-43cb-9fe5-25630c2b0c90',
        SHEET_NAME: 'Form Responses 1',
        BASE_URL: 'https://sheets.livepolls.app/api/spreadsheets/4620808b-aa88-43cb-9fe5-25630c2b0c90/Form%20Responses%201'
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