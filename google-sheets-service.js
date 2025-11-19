// Google Sheets Service dengan Service Account
class GoogleSheetsService {
    constructor() {
        this.privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQClFjIauJJ5gf0G
2nEvuCualpc3VD1mfn00hkifDEolZ3VQdok+DR4dx7444nbwdtpHiKrG0d749OEr
A8k7+QD8XsniMMywgZWjsCs8dl5NzgXBVZVsrnpiCHQnZrolv8DuZPuKoPxzv1Pp
FEsJa12D1RJA9lxP0DCb9m90smwr8wnOoHy96QZXqK+i6vG9c2yjgeJJEWvJBuuu
WurXDL8gHMDcqAPpDx8ezV6qXQvhsZ0yx597jZVXQAeeibVl/8R2DVDGCS5cEIVL
gCoch/9yXBN78DWZflaO3E6u90+0cxGuYn7/w2z+Zm6n9NQYo/UwCBDRp5AsGovc
jjhaTTSVAgMBAAECggEAE55+KN/LhIY2uFRIhEfKYs5HvUsVGvOoVJAq3D/9JdHU
RtI3gDjV3esph6AeS3iMe1jaFtPFQGf1xINoLGjsvZFUQ73R7Z4Q1wmuMbrNfUih
NXdC0U4w/CqOB0q1j5voxUwZ+sEkD2trAPWo7z8jt3GggDjnApM226ofV8qGgXhp
N7LJkxNAQO4/0CwJlhrC15euvMd0fr++V4NHpPJ23NhidJi5ygB9mjExbLs39aON
9mW0B2jMwZPI2xpxjzKv4AKHZUQ+WoliSSeo7jKm6gXO1pT8txKt6urVUOsXAg6d
N1n962Pld5maF8FQTUGjvu5p0OmcKkiQOIfSdmgW5wKBgQDbfi3nO2s9PvrOkmgr
trETvb3Nyhwc5jOwnqrt/b+xT1N0kYrglmsASgNIR4jCF0bSgoViHGCk9MYLmIn2
aPiyR/2lPXsJ2wHuKyLv2KrhUnpdLUAU3dyRNWzpO8D+bpkRjmH02dR/vZZokLRz
qPnu4q5qY1eivD5ng4+99jO5iwKBgQDAi3J+LWIEUgCrB84zCByfpx3qo3gmiFyi
72wsgFqeYSvtjJlrWQIr7GmYw2j2+2Q28a3SgtPb0A9xH3I5LJS3qzJRKrnnV5n1
61T1T4eOWZNsPaJ+cL5RYmqjmNV0fLSzn6RVUK96V+aZM1uGTId2e0u406qHPABp
qktG1BlOXwKBgA+rr41NwbdKss9ixoswbO4S4uU5Y85wZQpcGaoKLtBy8GtnJLoq
IxOPNTLI4Kuyy7yl0u4RRpkgXK9hQaBVGERqPWK5w/oNJ9MgQ0tKddDGebQDUgrr
WB8J6G+yc3H25XjKaJX5o2FHYOCwTCHh045Jotg3pX8Z3362duHCHSlHAoGBALII
vqb446bHBCMgpoL9PypIZhstZ82JTM7DvywuypujkfCmjr15oc5nXQSJuyaUMIe1
VFpP6gFYEs8wmndPR3vE6lOuxBKrJ4sCPJ5PGTKAlRYCr5tmODQcYio/CTAalyN3
u4W/g2IGoQyLNlepr5/YRZ3y6bz9uAv8EHq/Z17VAoGBAKKi7V8eYQrAFkTbsN1b
Ffpbomiv9UlgWMgxlPDNbykfdndqrLFhbu2bRfDGJwV0eqoi4rY2/k+mz8W6s/o5
BxV4ugrr/srqaUrrRHQEfjwHpQ9m5iI9tyoMXQjo3Es9zawSi8WdFhy9X5PtQU7H
7CycXtXNQAFyZi526UITZ5Mz
-----END PRIVATE KEY-----`.replace(/\\n/g, '\n');

        this.clientEmail = 'info-lomba-kse@noted-reef-478307-h1.iam.gserviceaccount.com';
        this.sheetId = '1tiJvmSgStMlXh54f-8HkW_vJeRyg0RvDC_qsu_N0FIg';
    }

    async getAccessToken() {
        const header = {
            alg: 'RS256',
            typ: 'JWT',
            kid: 'af37cb9baead26d213a3dabb848b080ccb90dd7c'
        };

        const now = Math.floor(Date.now() / 1000);
        const claimSet = {
            iss: this.clientEmail,
            scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now
        };

        // Encode header and claim set
        const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
        const encodedClaimSet = btoa(JSON.stringify(claimSet)).replace(/=/g, '');
        const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

        // In production, you'd need a proper RSA signing library
        // For now, we'll use a simpler approach
        return await this.simplerAuthApproach();
    }

    async simplerAuthApproach() {
        // Alternative approach: Use Google Apps Script as proxy
        return await this.fetchViaAppsScript();
    }

    async fetchViaAppsScript() {
        try {
            // We'll create a simple Google Apps Script later
            // For now, let's use the existing API key approach but with proper error handling
            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}/values/Sheet1?key=AIzaSyB9HcfxKM81VDXuOgMlB6nYVI3dI4crw`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }
}

// Export for use in main app
window.GoogleSheetsService = GoogleSheetsService;