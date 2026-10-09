# 🚀 Next.js Redis Management GUI

Modern, yüksek performanslı ve güvenli bir **Redis Yönetim Arayüzü (GUI)**. Next.js 14+ (App Router), Tailwind CSS, `@tanstack/react-virtual` ve `ioredis` kullanılarak geliştirilmiştir. 

Büyük veri kümelerini tarayıcıyı kilitlenmeden yönetmek, çoklu sunucular arasında hızlıca geçiş yapmak ve canlı metrikleri takip etmek için tasarlanmıştır.

---

## 🌟 Öne Çıkan Özellikler

- 🔒 **Güvenli Kimlik Doğrulama (Auth):**
  - İlk girişte varsayılan kimlik bilgileri (`admin` / `123456`).
  - İlk girişte **zorunlu şifre değiştirme** mekanizması.
  - HTTP-Only Cookie tabanlı encrypted session yönetimi.

- 🖥️ **Çoklu Sunucu Yönetimi (Multi-Server Management):**
  - Dilediğiniz kadar Redis sunucusu ekleme, silme ve sunucular arasında tek tıkla geçiş yapma.
  - Hassas sunucu bağlantı verilerinin (IP, Port, Parola) **AES-256-GCM** ile şifrelenip HTTP-Only cookie içinde saklanması.
  - TLS/SSL desteği (Upstash, Redis Cloud, AWS ElastiCache uyumlu).
  - Canlı bağlantı testi (`PING` / `PONG`).

- ⚡ **Yüksek Performans & Büyük Veri Desteği (Zero-Locking):**
  - Sunucuyu kilitletmeyen non-blocking **`SCAN`** algoritması (`KEYS *` kullanılmaz).
  - Devasa veri kümeleri için **Virtual Scrolling (`@tanstack/react-virtual`)** entegrasyonu (60 FPS Akıcı Scroll).
  - `List`, `Hash`, `Set`, `ZSet` ve `Stream` türleri için **Sayfalama (Pagination / Chunking)** koruması.

- 🧩 **Tüm Redis Veri Tiplerine Özel Editörler:**
  - **String & JSON:** Monaco Editor benzeri syntax highlighting destekli düzenleyici.
  - **Hash:** Field-Value bazlı arama, dinamik güncelleme ve ekleme.
  - **List:** Indeksleme ve sayfalama destekli liste yönetimi (`LPUSH`, `RPUSH`).
  - **Stream:** Zaman damgalı mesaj akışlarını inceleme, filtreleme ve entry ekleme (`XADD`, `XDEL`).
  - **ZSet & Set:** Skorlama ve benzersiz üye yönetimi.

- 📊 **Real-Time Server Metrics Dashboard:**
  - `INFO` komutu çıktılarından anlık Recharts grafikleri.
  - Memory Usage (MB), Throughput (Ops/sec), Active Clients, Hit Rate ve Total Keys metrikleri.
  - Canlı polling ve duraklatma (Live / Pause) seçenekleri.

- 💻 **Etkileşimli CLI Terminal:**
  - Dahili Redis komut satırı arayüzü (`INFO`, `GET`, `SET`, `DBSIZE` vb.).
  - Güvenlik filtresi (Tehlikeli `FLUSHALL`, `FLUSHDB` vb. komutlar engellenir).
  - Komut geçmişinde gezinme (Yukarı/Aşağı Ok tuşları) ve `Ctrl + L` ekran temizleme.

- 🐳 **Docker & Multi-Stage Deployment:**
  - Minimum imaj boyutu için **Next.js Standalone Output** konfigürasyonu.
  - Production-ready `Dockerfile` ve izole ağ destekli `docker-compose.yml`.

---

## 🛠️ Teknolojik Yığın (Tech Stack)

| Kategori | Teknoloji / Kütüphane |
| :--- | :--- |
| **Framework** | Next.js 14/15+ (App Router, Server Actions) |
| **Dil** | TypeScript |
| **Styling & UI** | Tailwind CSS v4, shadcn/ui, Lucide Icons |
| **Redis İstemcisi** | `ioredis` |
| **Performans** | `@tanstack/react-virtual` |
| **Grafik & Görselleştirme** | Recharts |
| **Şifreleme & Güvenlik** | Node.js `crypto` (AES-256-GCM, SHA-256) |
| **Konteynerizasyon** | Docker, Docker Compose |

---

## 📁 Proje Mimarisi

```text
├── app/
│   ├── actions/
│   │   ├── auth.ts          # Giriş & Şifre Değiştirme Server Action'ları
│   │   ├── cli.ts           # Terminal Komut Çalıştırma Action'ı
│   │   ├── connections.ts   # Şifreli Sunucu Yönetim Action'ları
│   │   ├── metrics.ts       # Canlı INFO Metrik Action'ları
│   │   └── redis.ts         # SCAN, List, Hash, Stream CRUD Action'ları
│   ├── layout.tsx
│   └── page.tsx             # Ana Layout & Sekme Yönetimi
├── components/
│   ├── auth/
│   │   └── login-view.tsx   # Login ve Zorunlu Şifre Değiştirme Kartı
│   └── redis/
│       ├── cli-terminal.tsx # CLI Console Bileşeni
│       ├── connection-switcher.tsx # Sunucu Seçici & Ekleme Modalı
│       ├── hash-editor.tsx  # Sanallaştırılmış Hash Editörü
│       ├── key-explorer-view.tsx # Ana Key Ağacı ve Detay Paneli
│       ├── list-editor.tsx  # Sanallaştırılmış List Editörü
│       ├── metrics-dashboard.tsx # Recharts Canlı Metrik Paneli
│       └── stream-editor.tsx # Redis Stream Mesaj Editörü
├── lib/
│   ├── auth.ts              # Session & Password Hash Yardımcıları
│   ├── crypto.ts            # AES-256-GCM Şifreleme/Çözme Katmanı
│   └── security.ts          # Tehlikeli CLI Komut Engelleyici
├── Dockerfile
├── docker-compose.yml
└── next.config.mjs

# 🗺️ Redis Management GUI - Proje Yol Haritası & README

Next.js 14+ (App Router), Tailwind CSS v4, `@tanstack/react-virtual` ve `ioredis` kullanılarak geliştirilmiş, yüksek performanslı, çoklu sunucu destekli ve güvenli Redis Yönetim Paneli.

---

## 📌 Proje Özeti
Bu proje; büyük veri kümelerinde tarayıcı kilitlenmelerini önleyen, gelişmiş bellek ve CPU optimizasyonlarına sahip, uçtan uca şifreli oturum ve sunucu yönetimi sunan modern bir Redis GUI uygulamasıdır.

---

## 🚀 Proje Yol Haritası (Roadmap)

### 🔴 Aşama 1: Temel Mimari ve Kurulum (Tamamlandı)
- [x] **Next.js App Router & Tailwind CSS v4** altyapısının kurulması.
- [x] **shadcn/ui** bileşen kütüphanesinin projeye entegrasyonu.
- [x] **ioredis** istemci bağlantı katmanının oluşturulması.
- [x] `KEYS *` yerine sunucuyu kilitlemeyen non-blocking **`SCAN`** mimarisine geçiş.

---

### 🟡 Aşama 2: Veri Editörleri ve Performans (Tamamlandı)
- [x] **Key Tree (Klasör Hiyerarşisi):** Key'lerin `:` ayracına göre ağaç yapısında listelenmesi.
- [x] **Monaco Editor:** String ve JSON tipleri için sözdizimi vurgulamalı veri editörü.
- [x] **Gelişmiş Veri Yapıları Desteği:**
  - **Hash Editor:** Field-Value çiftlerinin yönetimi (`HSCAN`, `HSET`, `HDEL`).
  - **List Editor:** Sayfalanmış liste yönetimi (`LRANGE`, `LPUSH`, `RPUSH`).
  - **Stream Editor:** Zaman damgalı mesaj akışı takibi (`XREVRANGE`, `XADD`, `XDEL`).
  - **Set & ZSet Editörleri:** Skorlama ve üye yönetimi.
- [x] **Virtual Scrolling Integration:** Devasa veri kümelerinde tarayıcının kilitlenmesini önlemek için `@tanstack/react-virtual` entegrasyonu.

---

### 🟢 Aşama 3: Güvenlik, Kimlik Doğrulama & Çoklu Sunucu (Tamamlandı)
- [x] **AES-256-GCM Şifreleme:** Sunucu bağlantı verilerinin (IP, Port, Parola) istemciye sızmayacak şekilde HTTP-Only Cookie içinde şifrelenmesi.
- [x] **Çoklu Sunucu Yönetimi (Connection Switcher):**
  - Birden fazla Redis sunucusu ekleme, silme ve canlı bağlantı testi (`PING`).
  - Tek tıkla sunucular arası geçiş ve soket temizliği.
  - TLS/SSL bağlantı desteği (Upstash, Redis Cloud uyumluluğu).
- [x] **Gelişmiş Kimlik Doğrulama (Auth System):**
  - Varsayılan giriş: `admin` / `123456`.
  - **İlk girişte zorunlu şifre değiştirme** akışı.
  - HTTP-Only Cookie tabanlı encrypted session yönetimi.
- [x] **Komut Doğrulama Layer'ı:** CLI üzerinde tehlikeli komutların (`FLUSHALL`, `FLUSHDB`, `SHUTDOWN` vb.) engellenmesi.

---

### 🔵 Aşama 4: İzleme, CLI ve Dağıtım (Tamamlandı)
- [x] **Real-Time Metrics Dashboard:**
  - Redis `INFO` çıktısından anlık Recharts grafikleri.
  - Used Memory, Throughput (Ops/sec), Clients, Hit Rate ve Total Keys takibi.
  - Canlı polling başlatma/durdurma kontrolleri.
- [x] **Interactive CLI Console:**
  - Dinamik aktif sunucuya bağlı çalışan interaktif komut satırı.
  - Ok tuşları ile komut geçmişinde gezinme ve `Ctrl + L` ekran temizleme.
  - Next.js Hydration uyumluluğu.
- [x] **Production Docker Paketleme:**
  - Minimal boyutta **Next.js Standalone Output** konfigürasyonu.
  - Production-ready `Dockerfile` ve izole ağa sahip `docker-compose.yml`.

---

### 🔮 Aşama 5: Gelecek Geliştirmeler (Gelecek Planlar)
- [ ] **Redis Pub/Sub Modülü:** Canlı kanalları dinleme ve mesaj yayınlama (`SUBSCRIBE` / `PUBLISH`) UI paneli.
- [ ] **Toplu İşlemler (Bulk Operations):** Birden fazla key seçip toplu silme veya TTL güncelleme.
- [ ] **Gelişmiş Filtreleme:** Key Explorer tarafında tipe (`Hash`, `List` vb.) veya TTL süresine göre gelişmiş arama paneli.
- [ ] **Redis Cluster & Sentinel Desteği:** Kümelenmiş Redis mimarileri için bağlantı yönetimi.

---

## 🛠️ Kurulum ve Çalıştırma Rehberi

### 1. Yerel Geliştirme (Local Development)

```bash
# 1. Depoyu klonlayın ve bağımlılıkları yükleyin
git clone [https://github.com/kullaniciadi/redis-management-gui.git](https://github.com/kullaniciadi/redis-management-gui.git)
cd redis-management-gui
npm install

# 2. .env.local dosyasını oluşturun
echo "ENCRYPTION_SECRET=12345678901234567890123456789012" > .env.local

# 3. Geliştirme sunucusunu başlatın
npm run dev