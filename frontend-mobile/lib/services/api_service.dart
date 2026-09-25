import '../models/user.dart';
import '../models/dashboard_data.dart';
import '../models/transaction.dart';
import '../models/reward.dart';
import '../models/drop_location.dart';
import '../models/app_notification.dart';
import '../models/scan_result.dart';

/// ============================================================================
/// ApiService
/// ----------------------------------------------------------------------------
/// Lapisan tunggal untuk semua komunikasi ke backend.
///
/// Saat ini SEMUA method mengembalikan MOCK DATA (lihat `_mockDelay`).
/// Setiap method punya blok komentar `// TODO(API)` yang mendeskripsikan
/// endpoint asli: HTTP method, path, header, request body, dan response.
///
/// Cara migrasi ke backend asli nanti:
///   1. Tambahkan package `http` (atau `dio`) di pubspec.yaml.
///   2. Set [baseUrl] dan [authToken].
///   3. Uncomment blok `// REAL:` di tiap method dan hapus `return _mockX(...)`.
///   4. Karena tiap model sudah punya `fromJson`, parsing tinggal dipakai.
/// ============================================================================
class ApiService {
  ApiService._();
  static final ApiService instance = ApiService._();

  /// Ganti dengan base URL backend produksi/staging.
  static const String baseUrl = 'https://api.smart-eco-bank.example.com';

  /// Token bearer disimpan di sini setelah login (atau dari secure storage).
  String? authToken;

  /// Simulasi latency jaringan supaya UI loading state tetap kelihatan natural.
  Future<void> _mockDelay([int ms = 700]) =>
      Future.delayed(Duration(milliseconds: ms));

  // Header standar untuk request yang butuh autentikasi.
  // ignore: unused_element
  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (authToken != null) 'Authorization': 'Bearer $authToken',
      };

  // ==========================================================================
  // AUTH  (M1 - Login & Registrasi)
  // ==========================================================================

  /// Login dengan email & password.
  ///
  /// TODO(API): POST $baseUrl/auth/login
  ///   Body   : { "email": String, "password": String }
  ///   Resp   : { "token": String, "user": { ...UserModel } }
  ///   Logic  : simpan token -> [authToken], lalu fetch dashboard.
  ///   Error  : 401 -> kredensial salah, 422 -> validasi gagal.
  Future<UserModel> login(String email, String password) async {
    await _mockDelay();

    // REAL:
    // final res = await http.post(
    //   Uri.parse('$baseUrl/auth/login'),
    //   headers: {'Content-Type': 'application/json'},
    //   body: jsonEncode({'email': email, 'password': password}),
    // );
    // if (res.statusCode != 200) throw ApiException.fromResponse(res);
    // final data = jsonDecode(res.body);
    // authToken = data['token'];
    // return UserModel.fromJson(data['user']);

    return _mockUser;
  }

  /// Registrasi akun baru.
  ///
  /// TODO(API): POST $baseUrl/auth/register
  ///   Body : { "full_name", "email", "phone", "password",
  ///            "password_confirmation", "address", "accept_terms": bool }
  ///   Resp : { "token", "user": { ...UserModel } }
  Future<UserModel> register({
    required String fullName,
    required String email,
    required String phone,
    required String password,
    required String address,
  }) async {
    await _mockDelay(1500);

    // REAL: kirim body di atas, parse token + user dari response.
    return _mockUser.copyWithName(fullName, email, phone, address);
  }

  /// Logout: invalidasi token di server lalu hapus lokal.
  ///
  /// TODO(API): POST $baseUrl/auth/logout (header Authorization).
  Future<void> logout() async {
    await _mockDelay(300);
    authToken = null;
  }

  // ==========================================================================
  // DASHBOARD  (M2 - Beranda)
  // ==========================================================================

  /// Ambil ringkasan poin, statistik sampah, & daftar dampak lingkungan.
  ///
  /// TODO(API): GET $baseUrl/dashboard  (header Authorization)
  ///   Resp : {
  ///     "point_balance": int, "rupiah_value": int,
  ///     "total_waste_kg": double, "co2_reduced_kg": double,
  ///     "impacts": [ { "icon", "title", "subtitle" } ]
  ///   }
  Future<DashboardData> getDashboard() async {
    await _mockDelay();

    // REAL:
    // final res = await http.get(Uri.parse('$baseUrl/dashboard'), headers: _headers);
    // return DashboardData.fromJson(jsonDecode(res.body));

    return const DashboardData(
      pointBalance: 1250,
      rupiahValue: 125000,
      totalWasteKg: 42.5,
      co2ReducedKg: 12.8,
      impacts: [
        ImpactItem(
          iconKey: 'forest',
          title: 'Kontribusi Hutan',
          subtitle: 'Kamu telah menyelamatkan 3 pohon.',
        ),
        ImpactItem(
          iconKey: 'water_drop',
          title: 'Konservasi Air',
          subtitle: 'Reduksi 500L air limbah produksi.',
        ),
      ],
    );
  }

  // ==========================================================================
  // LOCATIONS  (M3 - Lokasi Posko Drop-off)
  // ==========================================================================

  /// Daftar posko terdekat. Idealnya kirim lat/lng user untuk sorting jarak.
  ///
  /// TODO(API): GET $baseUrl/locations?lat={lat}&lng={lng}&q={query}
  ///   Resp : [ { "id","name","address","distance_km","open_info",
  ///              "is_open","lat","lng" } ]
  ///   Logic: backend hitung distance_km dari koordinat user.
  Future<List<DropLocation>> getLocations({String query = ''}) async {
    await _mockDelay();

    // REAL: GET dengan query param lat/lng/q, map list -> DropLocation.fromJson
    final all = const [
      DropLocation(
        id: 'loc-1',
        name: 'Lokasi Eco Central',
        address: 'Jl. Pemuda No. 10, Jakarta Pusat',
        distanceKm: 1.2,
        openInfo: 'Buka hingga 21:00',
        isOpen: true,
        lat: -6.1944,
        lng: 106.8451,
      ),
      DropLocation(
        id: 'loc-2',
        name: 'Lokasi Merdeka Point',
        address: 'Jl. Merdeka No. 5, Gambir',
        distanceKm: 2.8,
        openInfo: 'Buka besok jam 08:00',
        isOpen: false,
        lat: -6.1751,
        lng: 106.8272,
      ),
      DropLocation(
        id: 'loc-3',
        name: 'Posko Kebon Jeruk',
        address: 'Jl. Panjang No. 22, Kebon Jeruk',
        distanceKm: 4.1,
        openInfo: 'Buka hingga 20:00',
        isOpen: true,
        lat: -6.1981,
        lng: 106.7714,
      ),
    ];

    if (query.isEmpty) return all;
    return all
        .where((l) =>
            l.name.toLowerCase().contains(query.toLowerCase()) ||
            l.address.toLowerCase().contains(query.toLowerCase()))
        .toList();
  }

  // ==========================================================================
  // SCANNER  (M4 - AI Waste Detection)
  // ==========================================================================

  /// Kirim foto sampah ke model AI dan dapatkan hasil deteksi.
  ///
  /// TODO(API): POST $baseUrl/scan  (multipart/form-data)
  ///   Body : file=image, location_id=String
  ///   Resp : { "depositor_name","location_name","detected_product",
  ///            "category","material_type","confidence" }
  ///   Logic: backend menjalankan model klasifikasi (mis. PET/HDPE),
  ///          mengembalikan confidence + kategori sampah.
  Future<ScanResult> analyzeWaste({String? imagePath}) async {
    await _mockDelay(1200);

    // REAL: unggah file via http.MultipartRequest, parse ScanResult.fromJson.
    return const ScanResult(
      depositorName: 'Budi Santoso',
      locationName: 'Alamat Eco Central',
      detectedProduct: 'Botol Air Mineral',
      category: 'Anorganik',
      materialType: 'PET 01',
      confidence: 98.4,
    );
  }

  /// Hitung estimasi poin dari berat (gram).
  ///
  /// Catatan: di mockup rasionya 1000 gram = 2 poin (0.002 poin/gram).
  /// Saat backend siap, rasio bisa beda per kategori -> minta dari endpoint
  /// GET $baseUrl/scan/point-rate?category={category}, lalu kalikan di sini.
  double estimatePoints(double grams) => grams * 0.002;

  /// Submit setoran sampah final (setelah berat diinput).
  ///
  /// TODO(API): POST $baseUrl/deposits
  ///   Body : { "location_id","category","material_type",
  ///            "weight_grams": double }
  ///   Resp : { "transaction_id","estimated_points","status":"pending" }
  ///   Logic: status awal "pending" -> menunggu validasi fisik di posko.
  Future<TransactionModel> submitDeposit({
    required String category,
    required double grams,
  }) async {
    await _mockDelay(1000);

    // REAL: POST body di atas, parse TransactionModel.fromJson.
    final pts = estimatePoints(grams).round();
    return TransactionModel(
      id: 'tx-${DateTime.now().millisecondsSinceEpoch}',
      type: TxType.deposit,
      title: 'Setoran Sampah $category',
      poskoName: 'Posko Eco Central',
      time: TimeOfDayString.now(),
      status: TxStatus.pending,
      detail: 'Kategori $category',
      points: pts,
      isEstimate: true,
    );
  }

  // ==========================================================================
  // TRANSACTIONS  (M5 - Riwayat)
  // ==========================================================================

  /// Riwayat transaksi 30 hari terakhir.
  ///
  /// TODO(API): GET $baseUrl/transactions?filter={all|deposit|redeem}
  ///   Resp : [ { ...TransactionModel } ]
  Future<List<TransactionModel>> getTransactions(
      {String filter = 'all'}) async {
    await _mockDelay();

    // REAL: GET dengan query filter, map list -> TransactionModel.fromJson.
    final all = const [
      TransactionModel(
        id: 'tx-1',
        type: TxType.deposit,
        title: 'Setoran Sampah Anorganik',
        poskoName: 'Posko Kebon Jeruk',
        time: '14:20',
        status: TxStatus.pending,
        detail: 'Kategori Anorganik',
        points: 450,
        isEstimate: true,
      ),
      TransactionModel(
        id: 'tx-2',
        type: TxType.deposit,
        title: 'Setoran Sampah Plastik',
        poskoName: 'Posko Palmerah',
        time: '09:15',
        status: TxStatus.success,
        detail: '3.2 Kg • Botol PET',
        points: 1000,
      ),
      TransactionModel(
        id: 'tx-3',
        type: TxType.redeem,
        title: 'Penukaran Reward Totebag',
        poskoName: 'EcoHub Pusat',
        time: '11:40',
        status: TxStatus.success,
        detail: 'Totebag Kanvas',
        points: -10000,
      ),
    ];

    switch (filter) {
      case 'deposit':
        return all.where((t) => t.type == TxType.deposit).toList();
      case 'redeem':
        return all.where((t) => t.type == TxType.redeem).toList();
      default:
        return all;
    }
  }

  // ==========================================================================
  // REWARDS  (M6 - Katalog & Penukaran)
  // ==========================================================================

  /// Daftar reward yang bisa ditukar.
  ///
  /// TODO(API): GET $baseUrl/rewards
  ///   Resp : [ { "id","name","point_cost","image_url","coming_soon" } ]
  Future<List<RewardModel>> getRewards() async {
    await _mockDelay();

    // REAL: GET -> map list -> RewardModel.fromJson.
    return const [
      RewardModel(id: 'rw-1', name: 'Tumbler', pointCost: 50000),
      RewardModel(id: 'rw-2', name: 'Totebag', pointCost: 10000),
      RewardModel(id: 'rw-3', name: 'Topi', pointCost: 20000),
      RewardModel(
          id: 'rw-4', name: 'Coming Soon', pointCost: 0, comingSoon: true),
    ];
  }

  /// Tukar poin dengan sebuah reward.
  ///
  /// TODO(API): POST $baseUrl/rewards/{id}/redeem
  ///   Resp : { "success": bool, "remaining_points": int }
  ///   Logic: validasi saldo poin cukup, potong poin, buat transaksi redeem.
  ///   Error: 402 -> poin tidak cukup.
  Future<bool> redeemReward(String rewardId) async {
    await _mockDelay(900);
    // REAL: POST, cek response.success.
    return true;
  }

  // ==========================================================================
  // NOTIFICATIONS  (M8)
  // ==========================================================================

  /// TODO(API): GET $baseUrl/notifications
  ///   Resp : [ { "id","icon","title","body","time_ago","group","read" } ]
  Future<List<AppNotification>> getNotifications() async {
    await _mockDelay();

    // REAL: GET -> map list -> AppNotification.fromJson.
    return const [
      AppNotification(
        id: 'n-1',
        iconKey: 'check_circle',
        title: 'Setoran Plastik Berhasil (+1.000 Pts)',
        body:
            'Terima kasih atas kontribusi Anda. Poin hijau telah ditambahkan ke saldo Smart Eco Bank Anda.',
        timeAgo: '2mnt',
        group: 'Terbaru',
      ),
      AppNotification(
        id: 'n-2',
        iconKey: 'verified',
        title: 'Admin Memverifikasi Transaksi Anda',
        body:
            'Verifikasi penukaran poin ke saldo e-wallet Anda telah selesai diproses oleh tim kami.',
        timeAgo: '1j lalu',
        group: 'Terbaru',
      ),
      AppNotification(
        id: 'n-3',
        iconKey: 'card_giftcard',
        title: 'Reward Tumbler Siap Diambil',
        body:
            'Tukarkan kode QR Anda di EcoHub terdekat untuk mengambil Smart Eco Bank Limited Edition Tumbler.',
        timeAgo: '4j lalu',
        group: 'Terbaru',
      ),
      AppNotification(
        id: 'n-4',
        iconKey: 'eco',
        title: 'Laporan Mingguan Emisi',
        body:
            'Anda telah menghemat 12kg CO2 minggu ini melalui transaksi ramah lingkungan.',
        timeAgo: '1hr',
        group: 'Kemarin',
        read: true,
      ),
    ];
  }

  // ==========================================================================
  // CUSTOMER SERVICE  (M9 - Chat)
  // ==========================================================================

  /// Kirim pesan ke CS. Pada implementasi nyata gunakan WebSocket / polling.
  ///
  /// TODO(API): POST $baseUrl/support/messages
  ///   Body : { "text": String }
  ///   Resp : { "reply": { "sender","text","time","agent_name" } }
  ///   Logic: idealnya pakai WebSocket ($baseUrl -> wss://.../support/stream)
  ///          untuk balasan agen & indikator "sedang mengetik" real-time.
  Future<String> sendSupportMessage(String text) async {
    await _mockDelay(1100);
    // REAL: POST/WebSocket. Di sini balasan dummy dari "Sarah / CS Eco".
    return 'Terima kasih, kami sedang mengecek detail transaksi Anda. '
        'Mohon tunggu sebentar ya.';
  }

  // --- Mock user instance ---------------------------------------------------
  static const UserModel _mockUser = UserModel(
    id: 'usr-001',
    fullName: 'Budi Santoso',
    email: 'budi@email.com',
    phone: '081234567890',
    address: 'Jl. Hijau No. 123, Jakarta',
    pointBalance: 1250,
    greenLevel: 'Level 4: Green Hero',
  );
}

extension on UserModel {
  UserModel copyWithName(
          String name, String email, String phone, String address) =>
      UserModel(
        id: id,
        fullName: name,
        email: email,
        phone: phone,
        address: address,
        avatarUrl: avatarUrl,
        pointBalance: pointBalance,
        greenLevel: greenLevel,
      );
}

/// Util kecil untuk format jam "HH:mm".
class TimeOfDayString {
  static String now() {
    final n = DateTime.now();
    final h = n.hour.toString().padLeft(2, '0');
    final m = n.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}
