# Smart Eco Bank — Smart Sustainable Banking (Bank Sampah Digital)

Aplikasi Flutter (Android) hasil konversi dari 10 mockup HTML. Semua data masih
berupa **mock data**, namun setiap titik yang nanti memanggil backend sudah
didokumentasikan endpoint-nya, sehingga tinggal "colok" saat API siap.

## Cara menjalankan

```bash
flutter pub get
flutter run
```

Login mock sudah terisi otomatis: `budi@email.com` / `password` — tekan **Masuk**.

## Testing

```bash
flutter test
```

Jalankan test widget dan analisa lint:

```bash
flutter analyze lib
```

## Struktur folder

```
lib/
├── main.dart                  # Entry point + MultiProvider + MaterialApp
├── theme/                     # app_colors.dart, app_theme.dart (token dari mockup)
├── models/                    # Model data + fromJson/toJson (siap parsing API)
├── services/
│   └── api_service.dart       # ⭐ SATU lapisan untuk semua endpoint (lihat di bawah)
├── providers/                 # State management (Provider / ChangeNotifier)
├── widgets/                   # Komponen reusable (tombol, text field, icon mapper)
└── screens/                   # 1 folder per layar (auth, dashboard, scanner, dst)
```

## Pola mock → endpoint (INI BAGIAN PENTINGNYA)

Seluruh komunikasi backend dikumpulkan di `lib/services/api_service.dart`.
Tiap method memiliki:

1. Blok `TODO(API)` — deskripsi endpoint asli (HTTP method, path, body, response, logic).
2. Blok `// REAL:` — contoh kode `http` yang tinggal di-uncomment.
3. `return _mockX(...)` — data palsu yang dipakai sekarang.

Contoh (`login`):

```dart
/// TODO(API): POST $baseUrl/auth/login
///   Body : { "email": String, "password": String }
///   Resp : { "token": String, "user": { ...UserModel } }
Future<UserModel> login(String email, String password) async {
  await _mockDelay();

  // REAL:
  // final res = await http.post(Uri.parse('$baseUrl/auth/login'),
  //   headers: {'Content-Type': 'application/json'},
  //   body: jsonEncode({'email': email, 'password': password}));
  // authToken = jsonDecode(res.body)['token'];
  // return UserModel.fromJson(jsonDecode(res.body)['user']);

  return _mockUser; // <- hapus baris ini saat REAL diaktifkan
}
```

### Langkah migrasi ke backend asli

1. Tambah `http: ^1.2.0` (atau `dio`) di `pubspec.yaml`, jalankan `flutter pub get`.
2. Isi `ApiService.baseUrl` dengan URL backend, dan set `authToken` setelah login.
3. Di method yang ingin dihubungkan: uncomment blok `// REAL:`, hapus `return _mockX`.
4. Parsing sudah otomatis karena tiap model punya `fromJson`.

## Peta mockup → layar

| Mockup | Layar Flutter |
|--------|---------------|
| M1 Login / Registrasi | `screens/auth/` |
| M2 Beranda | `screens/dashboard/` |
| M3 Lokasi Posko | `screens/locations/` |
| M4 AI Scanner | `screens/scanner/` |
| M5 Riwayat | `screens/history/` |
| M6 Reward + sukses | `screens/rewards/` |
| M7 Pengaturan | `screens/settings/` |
| M8 Notifikasi | `screens/notifications/` |
| M9 Customer Service | `screens/customer_service/` |

## Catatan

- Estimasi poin scanner: `1000 gram = 2 poin` (0.002 poin/gram), sama dengan mockup M4.
- Peta lokasi (M3) digambar dengan `CustomPaint` (simulasi) — siap diganti
  `google_maps_flutter` saat dibutuhkan; data pin sudah punya `lat`/`lng`.
- Bahasa UI: Indonesia. Font: Manrope (body) + JetBrains Mono (label) via `google_fonts`.
