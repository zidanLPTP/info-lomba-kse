import requests
from bs4 import BeautifulSoup
import re
import os
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime

# --- KONFIGURASI GOOGLE SHEETS ---
# Ganti SPREADSHEET_URL dengan Link URL panjang Google Sheets Anda
SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1tiJvmSgStMlXh54f-8HkW_vJeRyg0RvDC_qsu_N0FIg/edit?gid=1305918544#gid=1305918544" 
WORKSHEET_NAME = "Form Responses 1" # Ganti dengan nama tab Sheet jika berbeda
CREDENTIALS_FILE = "credentials.json"
# ---------------------------------

BULAN_INDONESIA = {
    'januari': 1, 'jan': 1,
    'februari': 2, 'feb': 2,
    'maret': 3, 'mar': 3,
    'april': 4, 'apr': 4,
    'mei': 5,
    'juni': 6, 'jun': 6,
    'juli': 7, 'jul': 7,
    'agustus': 8, 'agu': 8, 'agus': 8,
    'september': 9, 'sep': 9, 'sept': 9,
    'oktober': 10, 'okt': 10,
    'november': 11, 'nov': 11,
    'desember': 12, 'des': 12
}

def ekstrak_tanggal(teks):
    teks = teks.lower().replace(',', '')
    match_bulan = re.search(r'(\d{1,2})\s+([a-z]+)\s+(\d{4}|\d{2})?', teks)
    if match_bulan:
        tgl = int(match_bulan.group(1))
        bln_teks = match_bulan.group(2)
        thn_teks = match_bulan.group(3)
        bln = BULAN_INDONESIA.get(bln_teks)
        if bln:
            thn = int(thn_teks) if thn_teks else datetime.now().year
            if thn < 100: thn += 2000
            try: return datetime(thn, bln, tgl)
            except: pass
            
    match_angka = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{4}|\d{2})', teks)
    if match_angka:
        tgl, bln, thn_teks = int(match_angka.group(1)), int(match_angka.group(2)), match_angka.group(3)
        thn = int(thn_teks) if len(thn_teks) == 4 else int(thn_teks) + 2000
        try: return datetime(thn, bln, tgl)
        except: pass
    return None

def main():
    print("Memulai proses Scraping & Sinkronisasi...")
    
    # 1. Hubungkan ke Google Sheets (JIKA ADA KREDENSIAL)
    konfigurasi_sheet_berhasil = False
    sheet = None
    
    if os.path.exists(CREDENTIALS_FILE):
        try:
            print("[INFO] File credentials.json ditemukan. Menghubungkan ke Google Sheets...")
            scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
            creds = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_FILE, scope)
            client = gspread.authorize(creds)
            
            if "ISI_DENGAN_URL_ANDA_DI_SINI" in SPREADSHEET_URL:
                print("\n[PERINGATAN] SPREADSHEET_URL belum diisi! Silakan ganti link/URL di script baris ke-10.")
            else:
                sheet = client.open_by_url(SPREADSHEET_URL).worksheet(WORKSHEET_NAME)
                konfigurasi_sheet_berhasil = True
                print("[INFO] Berhasil terhubung ke file Google Sheets!")
                
        except gspread.exceptions.SpreadsheetNotFound:
            print(f"[EROR] Dokumen tidak ditemukan! Pastikan Anda sudah SHARE dokumen tersebut ke email ini:\n -> {creds.service_account_email} <-")
        except gspread.exceptions.WorksheetNotFound:
            print(f"[EROR] Tab bernama '{WORKSHEET_NAME}' tidak ditemukan di dalam dokumen.")
        except Exception as e:
            print(f"[EROR] Gagal menghubungkan ke Sheets: {e}")
    else:
        print("[PERINGATAN] File credentials.json tidak ditemukan! Data HANYA akan dicetak ke Terminal.")

    # 2. Mulai Scraping
    print("\nMengambil data dari KabarLomba.com...")
    url = "https://www.kabarlomba.com/"
    
    # Menyamarkan bot dengan User-Agent agar tidak diblokir dasar
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        print(f"Gagal mengambil halaman: Status {response.status_code}")
        return
        
    print("Berhasil mengunduh halaman. Sedang mengekstrak data...")
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Mencari pola kotak/kartu lomba di halaman (Ini perlu kita uji coba)
    # Biasanya ada di dalam <article> atau class berisi kombinasi "post" atau "card"
    articles = soup.find_all('article')
    print(f"Ditemukan {len(articles)} artikel/kartu lomba.")
    
    results = []
    
    for article in articles[:5]: # Ambil 5 teratas dulu sebagai PoC
        # Coba ambil judul
        title_elem = article.find(['h2', 'h3'])
        title = title_elem.text.strip() if title_elem else "Tanpa Judul"
        
        # Coba ambil link
        link_elem = title_elem.find('a') if title_elem else article.find('a')
        link = link_elem.get('href') if link_elem else ""
        
        # Ekstrak data mentah untuk evaluasi
        print("-" * 30)
        print(f"Judul: {title}")
        print(f"Link:  {link}")
        
        results.append({
            "judul": title,
            "link": link
        })

    print(f"\nMengekstrak detail untuk {len(results)} lomba pertama...")
    
    for item in results[:3]:
        detail_resp = requests.get(item['link'], headers=headers)
        if detail_resp.status_code == 200:
            detail_soup = BeautifulSoup(detail_resp.text, 'html.parser')
            content = detail_soup.find('div', class_='post-body') or detail_soup.find('article')
            if content:
                text_content = content.get_text('\n').strip()
                
                # Cari pola tulisan "Deadline" atau "Batas" di baris-baris teks
                deadline_info = "Gagal Mengekstrak Teks Deadline"
                for line in text_content.split('\n'):
                    line_clean = line.strip()
                    if not line_clean: continue
                    
                    text_lower = line_clean.lower()
                    if 'deadline' in text_lower or 'batas' in text_lower or 'pendaftaran' in text_lower or 'ditutup' in text_lower:
                        if len(line_clean) < 150: # Pastikan bukan paragraf utuh
                            # Uji apakah baris ini punya tanggal rill
                            if ekstrak_tanggal(line_clean):
                                deadline_info = line_clean
                                break
                            
                item['deadline_snippet'] = deadline_info
                
                # Uji Validasi Tanggal
                parsed_date = ekstrak_tanggal(deadline_info)
                item['parsed_date'] = parsed_date
                
                # Cari Penyelenggara (Coba ekstrak dari baris teks dengan regex)
                org_match = re.search(r'(penyelenggara|oleh|held by)\s*:\s*(.{1,50})(?:\n|$)', text_content, re.IGNORECASE)
                item['penyelenggara'] = org_match.group(2).strip() if org_match else "[UMUM - KabarLomba]"
                
                # Deskripsi Singkat (Ambil paragraf pertama / kedua)
                paragraphs = content.find_all('p')
                deskripsi = paragraphs[1].get_text().strip() if len(paragraphs) > 1 else (paragraphs[0].get_text().strip() if paragraphs else "Informasi selengkapnya di link pendaftaran.")
                item['deskripsi'] = deskripsi[:150] + "..." if len(deskripsi) > 150 else deskripsi
                
                if parsed_date:
                    if parsed_date < datetime.now():
                        item['status_valid'] = "KEDALUWARSA"
                    else:
                        item['status_valid'] = "AKTIF / VALID"
                else:
                    item['status_valid'] = "TANGGAL TIDAK DIKENALI"

        if item.get('status_valid') == "KEDALUWARSA":
            print(f"\n[DIBUANG] Lomba sudah lewat deadline: {item['judul']}")
            continue
            
        print(f"\n[BERHASIL DIEKSTRAK] {item['judul']}")
        
        # Susun Array Data Baris (Sesuai 15+1 Kolom Template Sheets)
        tgl_format = f"M: - | D: {item['parsed_date'].strftime('%d %b %Y') if item.get('parsed_date') else item.get('deadline_snippet')}"
        
        row_data = [
            "Lomba",                            # 1. Jenis Informasi
            item['judul'],                      # 2. Judul Kegiatan
            "Nasional",                         # 3. Kategori
            "",                                 # 4. Bidang Lomba (Kosong, diisi manual admin)
            "Keduanya",                         # 5. Jenis Partisipasi
            item['penyelenggara'],              # 6. Penyelenggara
            tgl_format,                         # 7. Tanggal M/D
            "Online / Hybrid",                  # 8. Lokasi
            "Mahasiswa D3/D4/S1, Umum",         # 9. Level
            "Cek Link",                         # 10. Biaya
            "Uang Tunai + E-Sertifikat",        # 11. Benefit
            item['link'],                       # 12. Link Resmi
            "Cek Link Asli",                    # 13. Narahubung
            item['deskripsi'],                  # 14. Deskripsi
            "DIKLAT (Bot)",                     # 15. Divisi Penginput
            "PENDING"                           # 16. Status (Menunggu Approve Manual)
        ]

        if konfigurasi_sheet_berhasil and sheet:
            try:
                # Menambahkan baris ke paling bawah Google Sheets
                sheet.append_row(row_data)
                print(f" -> BERHASIL MENGIRIM DATA KE GOOGLE SHEETS!")
            except Exception as e:
                print(f" -> GAGAL MENGIRIM DATA: {e}")
        else:
            # Mode Terminal Preview Saja
            print("-" * 40)
            print("PREVIEW BARIS DATA YANG AKAN DI-PUSH:")
            for i, data in enumerate(row_data, 1):
                print(f"{i}. {data[:50] + '...' if len(data)>50 else data}")
            print("-" * 40)

    print("\n[+] Selesai Semua Proses!")

if __name__ == "__main__":
    main()
