# Smart Eco Bank (Frontend Web)

Aplikasi frontend berbasis **Next.js** untuk sistem Smart Eco Bank. Repositori ini berjalan berdampingan dengan backend Laravel.

## 🚀 Prasyarat
- **Node.js** `>=20.9.0` (LTS recommended)
- **npm** `11.x` (atau `yarn` / `pnpm`)
- Backend **Laravel Smart Eco Bank** yang sudah berjalan

---

## 🛠 Instalasi

1. Buka terminal dan masuk ke folder project ini.
2. Instal semua *dependency* yang dibutuhkan:
   ```bash
   npm install
   ```
3. Pastikan kamu memiliki file `.env` (bisa di-*copy* dari `.env.example` jika ada). Konfigurasi standarnya adalah sebagai berikut:
   ```env
   NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
   NEXT_PUBLIC_REVERB_APP_KEY=fl9khfsbv4bjyhlodehm
   NEXT_PUBLIC_REVERB_HOST="localhost"
   NEXT_PUBLIC_REVERB_PORT=8080
   NEXT_PUBLIC_REVERB_SCHEME=http
   ```

---

## 💻 Cara Menjalankan (Testing di Laptop Saja)

Jika kamu hanya ingin melakukan testing di laptop:

1. Pastikan server backend Laravel sudah menyala (`php artisan serve`).
2. Jalankan server *development* Next.js:
   ```bash
   npm run dev
   ```
3. Buka browser dan akses: `http://localhost:3000`

---

## 📱 PANDUAN TESTING DI HP (Wajib Dibaca)

Seringkali kita perlu melakukan testing langsung di HP (terutama untuk fitur kamera/scanner, dan melihat *responsive* UI). Agar HP bisa mengakses server lokal yang ada di laptopmu, **Laptop dan HP harus terhubung ke jaringan WiFi atau Hotspot yang sama**.

Ikuti langkah-langkah di bawah ini:

### 1. Cari Local IP Address Laptopmu
Buka terminal laptop dan jalankan perintah:
- **Linux/Mac**: `ip addr show` atau `ifconfig`
- **Windows**: `ipconfig`

Cari *IPv4 Address* dari jaringan WiFi/Hotspot-mu. Contoh bentuknya: `192.168.1.9` atau `192.168.43.37`.

### 2. Ubah Konfigurasi `.env`
HP tidak mengerti apa itu `localhost` (karena HP akan menganggap *localhost* adalah dirinya sendiri). Kamu wajib mengubah `localhost` menjadi **IP Address Laptopmu** di file `.env`:

```env
NEXT_PUBLIC_API_BASE_URL="http://192.168.43.37:8000"
NEXT_PUBLIC_REVERB_HOST="192.168.43.37"
```
*(Ganti `192.168.43.37` dengan IP Address aslimu).*

### 3. Jalankan Backend (Laravel) dengan Host 0.0.0.0
Buka terminal di project Backend Laravel, dan jalankan perintah ini agar backend mau menerima koneksi dari luar (HP):
```bash
php artisan serve --host=0.0.0.0 --port=8000
```
*(Jika kamu mengetes fitur Real-Time/Websocket, matikan Reverb dan jalankan ulang dengan: `php artisan reverb:start --host=0.0.0.0 --port=8080`)*

### 4. Jalankan Frontend (Next.js) dengan Host 0.0.0.0
Buka terminal di project Frontend (Next.js) ini, dan jalankan:
```bash
npm run dev -- -H 0.0.0.0
```

### 5. Akses Melalui HP
Buka Chrome/Safari di HP kamu, dan **ketik URL secara manual dan lengkap menggunakan `http://`** (jangan sampai kurang, agar browser tidak memaksanya menjadi HTTPS):
```text
http://192.168.43.37:3000
```

> **Troubleshooting / Masalah Sering Terjadi:**
> - **Loading terus di HP?** Kemungkinan *Firewall* di laptop (seperti Windows Defender atau `ufw` di Ubuntu) memblokir port 3000 atau 8000. Coba izinkan *port* tersebut di pengaturan firewall laptop. Di Linux jalankan: `sudo ufw allow 3000/tcp` dan `sudo ufw allow 8000/tcp`.
> - **Error Network?** Pastikan laptop dan HP benar-benar di WiFi/Hotspot yang sama. Jika IP laptop berubah, kamu wajib mengubah isi `.env` lagi.
> - **File gambar/foto dari HP terlalu besar?** Jangan khawatir, frontend project ini sudah dilengkapi fitur *auto compress image* menggunakan *Canvas* secara lokal sebelum dikirim ke backend untuk mencegah PHP Error `UPLOAD_ERR_INI_SIZE`.

---

## 📦 Teknologi yang Digunakan
- **Next.js** (App Router)
- **React**
- **Tailwind CSS v4**
- **Laravel Echo & Pusher JS** (Untuk Websocket Reverb)
- **MapLibre GL** (Integrasi Maps)
