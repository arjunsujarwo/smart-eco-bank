enum TxStatus { pending, success, failed }

extension TxStatusLabel on TxStatus {
  String get label {
    switch (this) {
      case TxStatus.pending:
        return 'Menunggu Validasi';
      case TxStatus.success:
        return 'Sukses';
      case TxStatus.failed:
        return 'Gagal';
    }
  }
}

enum TxType { deposit, redeem }

/// Model transaksi untuk layar Riwayat (M5).
class TransactionModel {
  final String id;
  final TxType type;
  final String title;
  final String poskoName;
  final String time; // contoh "14:20"
  final TxStatus status;
  final String detail; // "3.2 Kg - Botol PET" / "Kategori Anorganik"
  final int points; // bisa + atau estimasi
  final bool isEstimate;

  const TransactionModel({
    required this.id,
    required this.type,
    required this.title,
    required this.poskoName,
    required this.time,
    required this.status,
    required this.detail,
    required this.points,
    this.isEstimate = false,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) =>
      TransactionModel(
        id: json['id']?.toString() ?? '',
        type: (json['type'] == 'redeem') ? TxType.redeem : TxType.deposit,
        title: json['title'] ?? '',
        poskoName: json['posko_name'] ?? '',
        time: json['time'] ?? '',
        status: _statusFrom(json['status']),
        detail: json['detail'] ?? '',
        points: json['points'] ?? 0,
        isEstimate: json['is_estimate'] ?? false,
      );

  static TxStatus _statusFrom(dynamic s) {
    switch (s) {
      case 'success':
        return TxStatus.success;
      case 'failed':
        return TxStatus.failed;
      default:
        return TxStatus.pending;
    }
  }
}
