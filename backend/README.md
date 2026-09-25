# Smart Eco Bank (SEB) 🌍♻️

Selamat datang di *Smart Eco Bank*, sebuah platform revolusioner untuk menyetorkan sampah daur ulang, mengonversinya menjadi poin, dan menukarkannya dengan hadiah menarik (Reward). Aplikasi ini menggunakan AI untuk mendeteksi jenis sampah dan WebSocket untuk fitur *real-time chat* & notifikasi!

---

## 🛠️ Arsitektur Teknologi
Aplikasi ini terbagi menjadi tiga bagian:
1. **Backend**: Laravel 13.8 + Laravel Reverb (untuk WebSocket Real-time)
2. **Frontend (Web)**: Next.js 16 (React + TypeScript)
3. **Frontend (Mobile)**: Flutter 3.27+ (Dart)

---

## 📋 Prasyarat (Persiapan Sistem)
Sebelum menjalankan project ini, pastikan komputer/laptop kamu sudah terinstall:
- **Backend**: PHP `^8.3` & **Composer 2.x**
- **Frontend (Web)**: Node.js `>=20.9.0` & **npm 11.x** atau **yarn**
- **Frontend (Mobile)**: Flutter `>=3.27.0` & Dart `>=3.6.0`
- **Database Server**: MySQL/MariaDB atau PostgreSQL (konfigurasi di `.env`)
- **Git** (Opsional)

---

## 🚀 Cara Instalasi & Menjalankan Aplikasi

Karena aplikasi ini terdiri dari Backend dan Frontend, kamu harus menjalankan keduanya secara bersamaan di terminal yang terpisah.

### Tahap 1: Setup Backend (Laravel)
Buka terminal/CMD, lalu masuk ke folder backend:
```bash
cd backend
```
1. Install dependencies (jika baru pertama kali):
   ```bash
   composer install
   ```
2. Salin pengaturan environment:
   ```bash
   copy .env.example .env
   # atau pada Linux/Mac:
   # cp .env.example .env
   ```
3. Sesuaikan konfigurasi database di file `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=nama_database_kamu
   DB_USERNAME=root
   DB_PASSWORD=
   ```
4. Generate key & jalankan migrasi database:
   ```bash
   php artisan key:generate
   php artisan migrate --seed
   ```
5. **Jalankan Backend Server** (Gunakan IP `0.0.0.0` agar bisa diakses lewat HP nanti):
   ```bash
   php artisan serve --host=0.0.0.0 --port=8000
   ```
6. **(Terminal Baru)** Jalankan Queue Worker (untuk notifikasi background):
   ```bash
   php artisan queue:work
   ```
7. **(Terminal Baru)** Jalankan Laravel Reverb (untuk Chat/Notifikasi Real-time):
   ```bash
   php artisan reverb:start --debug
   ```

### Tahap 2: Setup Frontend (Next.js)
Buka terminal baru lagi, lalu masuk ke folder frontend:
```bash
cd Bootcamp-Kel-29/smart-eco-web
```
1. Install dependencies:
   ```bash
   npm install
   ```
2. Buat file `.env.local` dan atur URL backend-nya (ganti `localhost` dengan IP komputermu jika ingin diakses dari HP):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```
3. **Jalankan Frontend Server**:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
4. Buka di browser PC: `http://localhost:3000`

---

## 📱 Cara Testing Lewat HP (Satu Jaringan WiFi)
Jika kamu (atau temanmu) ingin mengetes membuka aplikasinya langsung dari HP:

1. Pastikan **PC dan HP** terhubung ke **jaringan WiFi/Hotspot yang sama**.
2. Cari tahu IPv4 dari komputermu (Ketik `ipconfig` di CMD Windows atau `ip a` di Linux/Mac). Misal: `192.168.1.5`.
3. Buka file `next.config.mjs` di folder Frontend.
4. Tambahkan IP tersebut ke dalam daftar `allowedDevOrigins` (jika menggunakan Next.js versi terbaru):
   ```javascript
   const nextConfig = {
     // ... pengaturan lain
     experimental: {
       allowedDevOrigins: ['192.168.1.5'],
     }
   };
   ```
   *(Jangan lupa restart frontend `npm run dev` setelah mengubah file ini)*
5. Ubah URL API di `.env.local` frontend dari `localhost` menjadi IP komputermu:
   ```env
   NEXT_PUBLIC_API_URL=http://192.168.1.5:8000/api
   ```
6. Akses dari browser HP: `http://192.168.1.5:3000`.

---

## 🎮 Alur Fitur Utama untuk Diuji (Testing Flows)

Berikut adalah *flow* yang wajib kamu coba:

### 1. Setor Sampah (Dapat Poin)
- **User**: Buka menu **Setor AI**, unggah foto sampah. Sistem akan mendeteksi kategori dan berat estimasi. Klik Kirim.
- **Admin**: Buka halaman **Verifikasi**, setujui transaksi. Sistem akan memunculkan QR Code di layar Admin.
- **User (Manual API Test saat ini)**: Fungsi scan QR di UI belum dibuat, namun secara backend kamu bisa mensimulasikannya via Postman dengan me-request ke `POST /api/scan-qr` dengan body `{"qr_token": "TOKEN_QR_CODE"}`. Transaksi akan Sukses dan poin bertambah!

### 2. Tukar Reward (Potong Poin)
- **User**: Buka menu **Reward**, pilih hadiah yang dimau (pastikan poin cukup).
- **Admin**: Buka dashboard Admin, ubah status pesanan menjadi `dikemas` atau `pengiriman`.
- **User**: Buka menu **Riwayat Transaksi** -> Klik detail tukar -> Klik tombol "Konfirmasi Terima Barang". Status akan berubah menjadi `selesai`.

### 3. Chat & Notifikasi Real-Time (Laravel Reverb)
- **User & Admin**: Buka menu **Chatbot / Pesan**. Kirim pesan satu sama lain dan lihat bagaimana pesannya muncul seketika (tanpa perlu di-*refresh*).
- **Notifikasi**: Lakukan aktivitas (misal: penolakan setoran, persetujuan reward), notifikasi *pop-up* akan muncul di perangkat lawan secara *real-time*.

---
Selamat mencoba dan mari bantu hijaukan bumi! 🌿
