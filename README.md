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