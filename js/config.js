const CONFIG = {
    GOOGLE_SHEET: {
        SHEET_ID: '1tiJvmSgStMlXh54f-8HkW_vJeRyg0RvDC_qsu_N0FIg',
        SHEET_NAME: 'Form Responses 1'
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