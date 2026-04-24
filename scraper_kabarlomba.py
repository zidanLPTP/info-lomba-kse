import requests
from bs4 import BeautifulSoup
import re
import time
from datetime import datetime
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# =========================
# CONFIG
# =========================
FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdkWYfU_OcJtWwRYTZios1-rUcqXjS1E9pA1yTVes5MOKucfw/formResponse"

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

# =========================
# SESSION (ANTI TIMEOUT & RETRY)
# =========================
def create_session():
    session = requests.Session()
    retries = Retry(
        total=5,
        backoff_factor=2,
        status_forcelist=[500, 502, 503, 504]
    )
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

session = create_session()

# =========================
# PARSER FUNCTIONS
# =========================

def extract_penyelenggara(text):
    match = re.search(r'(penyelenggara|oleh)\s*[:\-]\s*(.+)', text, re.IGNORECASE)
    return match.group(2).strip() if match else "Tidak diketahui"

def extract_kategori(text):
    t = text.lower()
    if "internasional" in t:
        return "Internasional"
    if "nasional" in t:
        return "Nasional"
    if "regional" in t:
        return "Regional"
    return "Nasional"

def extract_bidang(text):
    t = text.lower()
    if any(x in t for x in ["ai", "teknologi", "app", "software", "coding"]):
        return "Teknologi & Digital"
    if any(x in t for x in ["bisnis", "startup", "wirausaha"]):
        return "Bisnis & Kewirausahaan"
    if any(x in t for x in ["poster", "desain", "seni"]):
        return "Seni & Budaya"
    return "Akademik & Bahasa"

def extract_level(text):
    t = text.lower()
    if "sma" in t:
        return "SMA/Sederajat"
    if "mahasiswa" in t:
        return "Mahasiswa D3/D4/S1"
    return "Umum"

def extract_biaya(text):
    t = text.lower()
    if "gratis" in t:
        return "Gratis"
    if "rp" in t or "biaya" in t:
        return "Berbayar"
    return "Gratis"

def extract_deadline(text):
    match = re.search(
        r'(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+(\d{4})',
        text.lower()
    )

    bulan_map = {
        'januari':1,'februari':2,'maret':3,'april':4,'mei':5,'juni':6,
        'juli':7,'agustus':8,'september':9,'oktober':10,'november':11,'desember':12
    }

    if match:
        try:
            tgl = int(match.group(1))
            bln = bulan_map[match.group(2)]
            thn = int(match.group(3))
            return datetime(thn, bln, tgl).strftime("%Y-%m-%d")
        except:
            return datetime.now().strftime("%Y-%m-%d")

    return datetime.now().strftime("%Y-%m-%d")

# =========================
# KIRIM KE GOOGLE FORM
# =========================

def kirim(item):
    try:
        data = {
            "entry.558548208": "Lomba",
            "entry.149191259": item['judul'],
            "entry.978408814": item['kategori'],
            "entry.205610016": item['bidang'],
            "entry.2100638323": "Keduanya",
            "entry.938214674": item['penyelenggara'],
            "entry.857819101": item['tanggal_mulai'],
            "entry.1588948129": item['deadline'],
            "entry.328875203": "Online",
            "entry.663970367": item['level'],
            "entry.728063400": item['biaya'],
            "entry.375282935": "Sertifikat + Hadiah",
            "entry.1370160351": item['link'],
            "entry.281271846": "-",
            "entry.2045657726": item['deskripsi'],
            "entry.452725760": "DIKLAT"
        }

        res = session.post(FORM_URL, data=data, timeout=10)
        print("✔ Kirim:", item['judul'], "|", res.status_code)

    except Exception as e:
        print("❌ Gagal kirim:", item['judul'], "|", e)

# =========================
# MAIN SCRAPER
# =========================

def main():
    print("Mulai scraping...")

    url = "https://www.kabarlomba.com/"

    try:
        res = session.get(url, headers=HEADERS, timeout=10)
    except Exception as e:
        print("❌ Gagal akses website:", e)
        return

    soup = BeautifulSoup(res.text, "html.parser")
    articles = soup.find_all("article")

    print("Jumlah artikel:", len(articles))

    for article in articles[:5]:

        try:
            title_elem = article.find(['h2', 'h3'])
            if not title_elem:
                continue

            judul = title_elem.text.strip()

            link_elem = title_elem.find('a')
            if not link_elem:
                continue

            link = link_elem.get('href')

            print("Ambil:", judul)

            # ================= DETAIL =================
            try:
                detail = session.get(link, headers=HEADERS, timeout=10)
            except Exception as e:
                print("❌ Gagal buka detail:", e)
                continue

            detail_soup = BeautifulSoup(detail.text, "html.parser")

            content = detail_soup.find('div', class_='post-body')
            if not content:
                continue

            text = content.get_text("\n")

            # ================= PARSING =================
            item = {
                "judul": judul,
                "penyelenggara": extract_penyelenggara(text),
                "kategori": extract_kategori(text),
                "bidang": extract_bidang(text),
                "level": extract_level(text),
                "biaya": extract_biaya(text),
                "tanggal_mulai": datetime.now().strftime("%Y-%m-%d"),
                "deadline": extract_deadline(text),
                "link": link,
                "deskripsi": text[:200]
            }

            print("DATA:", item)

            # ================= KIRIM =================
            kirim(item)

            time.sleep(3)

        except Exception as e:
            print("❌ Error artikel:", e)
            continue

    print("Selesai!")

# =========================

if __name__ == "__main__":
    main()