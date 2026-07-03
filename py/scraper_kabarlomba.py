import requests
from bs4 import BeautifulSoup
import re
import time
from datetime import datetime
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import json
import os
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

# ponytail: native .env file parser to avoid installing python-dotenv dependency
def load_env():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()

load_env()

# CONFIG & LOGGING
FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdkWYfU_OcJtWwRYTZios1-rUcqXjS1E9pA1yTVes5MOKucfw/formResponse"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
}

# Setup Logging - ponytail: path relative to script directory
LOG_FILE = os.path.join(os.path.dirname(__file__), "scraper.log")
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# ANTI-DUPLIKAT (HISTORY) - ponytail: path relative to script directory
HISTORY_FILE = os.path.join(os.path.dirname(__file__), "scraped_history.json")

# TELEGRAM BOT CONFIGURATION
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")

def send_telegram_notification(item):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        logging.info("Notifikasi Telegram dilewati (Token/Chat ID tidak diset)")
        return
        
    benefit_clean = item['benefit'].replace('|', '\n-').strip()
    
    # Format message yang rapi dan profesional untuk Telegram
    message = (
        f"📢 *INFO LOMBA BARU - KSEUNRIPEDIA* 🎓\n\n"
        f"🏆 *{item['judul']}*\n"
        f"🏢 *Penyelenggara*: {item['penyelenggara']}\n\n"
        f"📌 *Kategori/Bidang*: {item['kategori']} / {item['bidang']}\n"
        f"💸 *Biaya*: {item['biaya']}\n"
        f"🎁 *Benefit/Hadiah*:\n- {benefit_clean}\n"
        f"⏰ *Deadline*: {item['deadline']}\n\n"
        f"🔗 *Link Resmi/Pendaftaran*:\n{item['link']}\n\n"
        f"Ayo persiapkan diri Anda dan raih prestasi!"
    )
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "Markdown"
    }
    
    try:
        res = requests.post(url, json=payload, timeout=10)
        if res.status_code == 200:
            logging.info(f"Notifikasi Telegram sukses dikirim: {item['judul']}")
        else:
            logging.warning(f"Gagal mengirim notifikasi Telegram ({res.status_code}): {res.text}")
    except Exception as e:
        logging.error(f"Error mengirim notifikasi Telegram: {e}")

def load_history():
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
            try:
                return set(json.load(f))
            except json.JSONDecodeError:
                return set()
    return set()

def save_history(history_set):
    with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(list(history_set), f, indent=4)

# SESSION (ANTI TIMEOUT & RETRY)
def create_session():
    session = requests.Session()
    retries = Retry(total=5, backoff_factor=2, status_forcelist=[500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

session = create_session()

# PARSING LOGIC & EXTRACTION
def clean_text(text):
    """Menghapus whitespace berlebih dan teks tidak penting."""
    text = re.sub(r'\s+', ' ', text).strip()
    text = re.sub(r'(?i)halo kabarlomba.*', '', text)
    return text

def extract_penyelenggara(full_text):
    # Cari dengan regex multiline
    match = re.search(r'(?i)(penyelenggara|diselenggarakan oleh|diadakan oleh|organized by|oleh|hosted by|presented by)\s*[:\-]?\s*([^\n]+)', full_text)
    if match and match.group(2).strip():
        hasil = clean_text(match.group(2))
        # Bersihkan emoji dan markdown karakter agar bersih di database
        hasil = re.sub(r'[^\x00-\x7F]+', '', hasil)
        hasil = re.sub(r'[\*\_~`#\[\]\(\)\<\>\{\}\-\|\:\+]+', '', hasil).strip()
        if len(hasil) < 60: return hasil
        else: return hasil[:60] + "..."
        
    # Fallback 1: Email
    match_email = re.search(r'(?i)email\s*[:\n\-]+\s*([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', full_text)
    if match_email:
        return match_email.group(1)

    # Fallback 2: Instagram
    match_ig = re.search(r'(?i)(instagram|ig)\s*[:\n\-]+\s*(@[a-zA-Z0-9_.]+)', full_text)
    if match_ig:
        return match_ig.group(2)
        
    return "Tidak diketahui"

def extract_pelaksanaan(text):
    t_lower = text.lower()
    if "hybrid" in t_lower:
        return "Hybrid"
    elif "offline" in t_lower or "luring" in t_lower or "di tempat" in t_lower:
        return "Offline"
    return "Online"

def extract_timeline(full_text):
    bulan_map = {
        'januari':'01','februari':'02','maret':'03','april':'04','mei':'05','juni':'06',
        'juli':'07','agustus':'08','september':'09','oktober':'10','november':'11','desember':'12',
        'january':'01','february':'02','march':'03','may':'05','june':'06',
        'july':'07','august':'08','october':'10','december':'12',
        'jan':'01','feb':'02','mar':'03','apr':'04','jun':'06','jul':'07','aug':'08','sept':'09','oct':'10','nov':'11','dec':'12'
    }
    
    date_pattern = r'(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|january|february|march|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|oct|nov|dec)(?:\s+(\d{4}))?'
    current_year = datetime.now().year
    
    registration_dates = []
    other_dates = []
    
    reg_keywords = ['daftar', 'registration', 'gelombang', 'batch', 'early', 'normal', 'late', 'batas', 'deadline', 'tahap']
    stop_keywords = ['pengumuman', 'winner', 'announcement', 'technical meeting', ' tm ', 'presentasi', 'penjurian', 'final ', 'award', 'juara']
    
    for line in full_text.split('\n'):
        line = line.lower().strip()
        if any(sk in line for sk in stop_keywords):
            continue
            
        # 1. Cari pola tanggal dengan nama bulan (e.g. 15 Juni 2026)
        dates = re.findall(date_pattern, line)
        if dates:
            parsed_dates = []
            for d in dates:
                try:
                    tgl = int(d[0])
                    bln = int(bulan_map[d[1].lower()])
                    thn = int(d[2]) if d[2] else current_year
                    dt = datetime(thn, bln, tgl)
                    parsed_dates.append(dt)
                except:
                    pass
            
            if any(rk in line for rk in reg_keywords):
                registration_dates.extend(parsed_dates)
            else:
                other_dates.extend(parsed_dates)
                
        # 2. Cari pola tanggal numerik (e.g. 12/08/2026 atau 15-09-26)
        numeric_dates = re.findall(r'\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b', line)
        if numeric_dates:
            parsed_numeric = []
            for nd in numeric_dates:
                try:
                    tgl = int(nd[0])
                    bln = int(nd[1])
                    thn = int(nd[2])
                    if thn < 100:
                        thn += 2000
                    dt = datetime(thn, bln, tgl)
                    parsed_numeric.append(dt)
                except:
                    pass
            if any(rk in line for rk in reg_keywords):
                registration_dates.extend(parsed_numeric)
            else:
                other_dates.extend(parsed_numeric)
                
    target_dates = registration_dates if registration_dates else other_dates
                
    if target_dates:
        target_dates.sort()
        tgl_mulai = target_dates[0].strftime("%Y-%m-%d")
        deadline = target_dates[-1].strftime("%Y-%m-%d")
        return tgl_mulai, deadline
                
    return datetime.now().strftime("%Y-%m-%d"), datetime.now().strftime("%Y-%m-%d")

def extract_biaya(full_text):
    text = full_text.lower()
    # Deteksi pola harga seperti Rp 50.000 atau Rp. 50k atau Rp50.000
    has_price = re.search(r'(?i)rp\s*\d+', text) or ("htm" in text and re.search(r'\d+', text))
    
    if "gratis" in text or "free" in text:
        if not has_price:
            return "Gratis"
        return "Berbayar"
    elif has_price or "berbayar" in text or "paid" in text:
        return "Berbayar"
        
    return "Gratis"

def extract_benefit(full_text):
    benefit_text = []
    capture = False
    for line in full_text.split('\n'):
        text = line.strip()
        if re.search(r'(?i)(benefit|hadiah|penghargaan|fasilitas)', text):
            capture = True
            safe_text = re.sub(r'(?i)^(benefit|hadiah|penghargaan|fasilitas)\s*[:\-]*', '', text).strip()
            if safe_text:
                benefit_text.append(safe_text)
            continue
            
        if capture and re.search(r'(?i)(biaya|link|timeline|narahubung|syarat|kontak|pendaftaran)', text):
            break
            
        if capture and text:
            benefit_text.append(text)
            
    if benefit_text:
        return clean_text(" | ".join(benefit_text))
    return "Sertifikat"

def extract_link(content_div, default_url="-"):
    a_tags = content_div.find_all('a')
    for a in a_tags:
        href = a.get('href', '')
        text = a.get_text().lower()
        if "daftar" in text or "link" in text or "bit.ly" in href or "linktr.ee" in href or "forms.gle" in href:
            if href.startswith('http'):
                return href
                
    full_text = content_div.get_text('\n')
    urls = re.findall(r'(https?://(?:bit\.ly|linktr\.ee|forms\.gle|docs\.google)[^\s]+)', full_text)
    if urls:
        return urls[0]
        
    return default_url if default_url else "-"

def extract_narahubung(full_text):
    cp_text = []
    # Tangkap pola kontak HP (+62, 08, 62)
    phone_pattern = r'(?i)(?:wa|whatsapp|hubungi|kontak|contact|cp|narahubung)?\s*[:\n\-]*\s*((?:\+62|08|62)\d{2,4}[\s\-]*\d{3,4}[\s\-]*\d{3,5})'
    matches = re.findall(phone_pattern, full_text)
    for m in matches:
        # Bersihkan spasi dan strip
        clean_num = re.sub(r'[\s\-]+', '', m)
        if len(clean_num) >= 10 and clean_num not in cp_text:
            cp_text.append(clean_num)
            
    if cp_text:
        return " | ".join(cp_text[:2])
    return "-"

def get_level_and_partisipasi(text):
    level = "Umum"
    partisipasi = "Keduanya"
    t_lower = text.lower()
    
    # Deteksi level
    has_sma = any(k in t_lower for k in ["sma ", "smk ", "pelajar", "siswa "])
    has_mahasiswa = any(k in t_lower for k in ["mahasiswa", "kampus", "universitas"])
    
    if has_sma and has_mahasiswa:
        level = "Umum"
    elif has_mahasiswa:
        level = "Mahasiswa D3/D4/S1"
    elif has_sma:
        level = "SMA/Sederajat"
    else:
        level = "Umum"
        
    # Deteksi Partisipasi
    if "individu" in t_lower or "perorangan" in t_lower:
        partisipasi = "Individu"
    elif "kelompok" in t_lower or "tim " in t_lower:
        partisipasi = "Kelompok/Tim"
        
    return level, partisipasi

def extract_kategori_dan_bidang(text):
    t = text.lower()
    kategori = "Nasional"
    if "internasional" in t:
        kategori = "Internasional"
    elif "regional" in t:
        kategori = "Regional"
        
    bidang = "Akademik & Bahasa"
    if any(x in t for x in ["ai", "teknologi", "app", "software", "coding", "it", "web"]):
        bidang = "Teknologi & Digital"
    elif any(x in t for x in ["bisnis", "startup", "wirausaha", "business"]):
        bidang = "Bisnis & Kewirausahaan"
    elif any(x in t for x in ["poster", "desain", "seni", "puisi", "tari"]):
        bidang = "Seni & Budaya"
        
    return kategori, bidang

def extract_with_gemini(full_text, title_hint):
    """Menggunakan Gemini API (jika ada API key di environment) untuk ekstraksi data super akurat."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None
        
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        prompt = f"""Analisis teks artikel lomba/kegiatan mahasiswa berikut dan ekstrak informasinya dalam bahasa Indonesia.
Judul artikel: {title_hint}

Teks artikel:
{full_text}

Kembalikan respon HANYA dalam format JSON mentah tanpa tag markdown dengan struktur seperti ini:
{{
  "judul": "Judul kegiatan yang bersih",
  "penyelenggara": "Nama universitas/perusahaan/BEM/HIMA penyelenggara",
  "tanggal_mulai": "YYYY-MM-DD (tanggal mulai pendaftaran, gunakan hari ini jika tidak disebutkan)",
  "deadline": "YYYY-MM-DD (deadline pendaftaran)",
  "biaya": "Gratis ATAU Berbayar",
  "benefit": "Benefit, hadiah, sertifikat, dll",
  "link": "Link pendaftaran jika ada, atau -",
  "narahubung": "Nomor WA atau kontak panitia, atau -",
  "level": "Mahasiswa D3/D4/S1 ATAU SMA/Sederajat ATAU Umum",
  "partisipasi": "Individu ATAU Kelompok/Tim ATAU Keduanya",
  "kategori": "Nasional ATAU Internasional ATAU Regional",
  "bidang": "Akademik & Bahasa ATAU Teknologi & Digital ATAU Seni & Budaya ATAU Bisnis & Kewirausahaan ATAU Bela Diri & Olahraga",
  "pelaksanaan": "Online ATAU Offline ATAU Hybrid",
  "deskripsi": "Deskripsi singkat/persyaratan utama"
}}
Penting: Kembalikan string JSON mentah. Jangan sertakan pembungkus seperti ```json."""

        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"}
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=20)
        if response.status_code == 200:
            res_json = response.json()
            text_output = res_json['candidates'][0]['content']['parts'][0]['text']
            
            # Bersihkan markdown ticks jika ada
            clean_text = text_output.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            elif clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            clean_text = clean_text.strip()
            
            return json.loads(clean_text)
    except Exception as e:
        logging.error(f"Gagal mengekstrak dengan Gemini AI: {e}")
    return None

# KIRIM & PROCESS
def kirim(item):
    try:
        data = {
            "entry.558548208": "Lomba",
            "entry.149191259": item['judul'],
            "entry.978408814": item['kategori'],
            "entry.205610016": item['bidang'],
            "entry.2100638323": item['partisipasi'],
            "entry.938214674": item['penyelenggara'],
            "entry.857819101": item['tanggal_mulai'],
            "entry.1588948129": item['deadline'],
            "entry.328875203": item['pelaksanaan'],
            "entry.663970367": item['level'],
            "entry.728063400": item['biaya'],
            "entry.375282935": item['benefit'],
            "entry.1370160351": item['link'],
            "entry.281271846": item.get('narahubung', '-'),
            "entry.2045657726": item['deskripsi'],
            "entry.452725760": "DIKLAT"
        }

        res = session.post(FORM_URL, data=data, timeout=10)
        if res.status_code == 200:
            logging.info(f"Kirim Sukses: {item['judul']}")
            return True
        else:
            logging.warning(f"Kirim Gagal (Status {res.status_code}): {item['judul']}")
            return False
    except Exception as e:
        logging.error(f"Gagal kirim: {item['judul']} | Error: {e}")
        return False

def process_article(artikel_url, judul_lomba):
    try:
        detail = session.get(artikel_url, headers=HEADERS, timeout=10)
        detail.raise_for_status()
    except Exception as e:
        logging.error(f"Gagal buka detail artikel: {artikel_url} | Error: {e}")
        return None

    detail_soup = BeautifulSoup(detail.text, "html.parser")
    
    h1 = detail_soup.find('h1', class_=re.compile(r'post-title|entry-title'))
    judul_lomba_fix = h1.get_text().strip() if h1 else judul_lomba
    
    content_div = detail_soup.find('div', class_=re.compile(r'post-body|post-body-artikel'))
    if not content_div:
        logging.warning(f"Lewati: Tidak menemukan div.post-body pada {artikel_url}")
        return None

    full_text = content_div.get_text("\n")
    
    # Coba gunakan Gemini AI jika API key tersedia di Environment
    gemini_data = None
    if os.environ.get("GEMINI_API_KEY"):
        logging.info(f"Mencoba ekstraksi pintar via Gemini AI: {judul_lomba_fix}")
        gemini_data = extract_with_gemini(full_text, judul_lomba_fix)
        
    if gemini_data:
        logging.info(f"Ekstraksi Gemini sukses untuk: {judul_lomba_fix}")
        item = {
            "judul": gemini_data.get("judul", judul_lomba_fix),
            "penyelenggara": gemini_data.get("penyelenggara", "Tidak diketahui"),
            "deadline": gemini_data.get("deadline", datetime.now().strftime("%Y-%m-%d")),
            "tanggal_mulai": gemini_data.get("tanggal_mulai", datetime.now().strftime("%Y-%m-%d")),
            "biaya": gemini_data.get("biaya", "Gratis"),
            "benefit": gemini_data.get("benefit", "Sertifikat"),
            "link": gemini_data.get("link", artikel_url),
            "narahubung": gemini_data.get("narahubung", "-"),
            "level": gemini_data.get("level", "Umum"),
            "partisipasi": gemini_data.get("partisipasi", "Keduanya"),
            "kategori": gemini_data.get("kategori", "Nasional"),
            "bidang": gemini_data.get("bidang", "Akademik & Bahasa"),
            "pelaksanaan": gemini_data.get("pelaksanaan", "Online"),
            "deskripsi": gemini_data.get("deskripsi", clean_text(full_text)[:150] + "...")
        }
    else:
        # Fallback ke Parsing Regex Tradisional
        logging.info(f"Menggunakan ekstraksi Regex (Rule-Based): {judul_lomba_fix}")
        penyelenggara = extract_penyelenggara(full_text)
        tgl_mulai, deadline = extract_timeline(full_text)
        biaya = extract_biaya(full_text)
        benefit = extract_benefit(full_text)
        link_pendaftaran = extract_link(content_div, artikel_url)
        narahubung = extract_narahubung(full_text)
        level, partisipasi = get_level_and_partisipasi(full_text)
        kategori, bidang = extract_kategori_dan_bidang(full_text)
        pelaksanaan = extract_pelaksanaan(full_text)
        deskripsi = clean_text(full_text)[:150] + "..."

        item = {
            "judul": judul_lomba_fix,
            "penyelenggara": penyelenggara,
            "deadline": deadline,
            "tanggal_mulai": tgl_mulai,
            "biaya": biaya,
            "benefit": benefit,
            "link": link_pendaftaran,
            "narahubung": narahubung,
            "level": level,
            "partisipasi": partisipasi,
            "kategori": kategori,
            "bidang": bidang,
            "pelaksanaan": pelaksanaan,
            "deskripsi": deskripsi
        }
    
    if item["pelaksanaan"] != "Online":
        logging.info(f"Dilewati (Bukan Online): {item['judul']}")
        return None
        
    if item["level"] == "SMA/Sederajat":
        logging.info(f"Dilewati (Eksklusif SMA/Pelajar): {item['judul']}")
        return None
    
    return item, artikel_url

# MAIN SCRAPER
def main():
    logging.info("Mulai scraping cerdas dengan Concurrency & Anti-Duplikat...")
    url = "https://www.kabarlomba.com/"
    
    MAX_PAGES = 3 # Batas maksimal halaman yang discrape
    current_page = 1
    scraped_history = load_history()
    
    while url and current_page <= MAX_PAGES:
        logging.info(f"\n=== Memproses Halaman {current_page}: {url} ===")
        try:
            res = session.get(url, headers=HEADERS, timeout=10)
            res.raise_for_status()
        except Exception as e:
            logging.error(f"Gagal akses URL: {url} | Error: {e}")
            break

        soup = BeautifulSoup(res.text, "html.parser")
        articles = soup.find_all("article")
        logging.info(f"Jumlah artikel ditemukan di halaman ini: {len(articles)}")

        tasks_to_run = []
        for article in articles:
            title_elem = article.find(['h2', 'h3'])
            if not title_elem: continue
            
            link_elem = title_elem.find('a')
            if not link_elem: continue
            
            artikel_url = link_elem.get('href')
            judul_lomba = title_elem.text.strip()
            
            if artikel_url in scraped_history:
                logging.info(f"Dilewati (Sudah di-scrape): {artikel_url}")
                continue
                
            tasks_to_run.append((artikel_url, judul_lomba))

        if tasks_to_run:
            logging.info(f"Memproses {len(tasks_to_run)} artikel secara konkuren...")
            # Menjalankan task secara bersamaan dengan ThreadPoolExecutor
            with ThreadPoolExecutor(max_workers=5) as executor:
                futures = {executor.submit(process_article, task[0], task[1]): task[0] for task in tasks_to_run}
                
                for future in as_completed(futures):
                    url_task = futures[future]
                    try:
                        result = future.result()
                        if result:
                            item, parsed_url = result
                            logging.info(f"DATA EKSTRAKSI: {item['judul']} | Mulai: {item['tanggal_mulai']} | Akhir: {item['deadline']}")
                            if kirim(item):
                                scraped_history.add(parsed_url)
                                save_history(scraped_history)
                                send_telegram_notification(item)
                    except Exception as e:
                        logging.error(f"Error pada task artikel {url_task}: {e}")
        else:
            logging.info("Tidak ada artikel baru di halaman ini.")

        # Pagination: Mencari tombol Next / Postingan Lama
        older_posts_link = soup.find('a', string=re.compile(r'(?i)postingan lama|older posts|selanjutnya'))
        if not older_posts_link:
            older_posts_link = soup.find('a', id='Blog1_blog-pager-older-link')

        if older_posts_link and older_posts_link.get('href'):
            url = older_posts_link.get('href')
            current_page += 1
            time.sleep(2) # Delay sebelum pindah halaman
        else:
            logging.info("Tidak ada halaman selanjutnya yang ditemukan.")
            break

    logging.info("Scraping selesai seluruhnya!")

if __name__ == "__main__":
    main()