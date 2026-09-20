/// Data agregat untuk layar Beranda (M2).
class ImpactItem {
  final String iconKey; // dipetakan ke IconData di UI
  final String title;
  final String subtitle;

  const ImpactItem({
    required this.iconKey,
    required this.title,
    required this.subtitle,
  });

  factory ImpactItem.fromJson(Map<String, dynamic> json) => ImpactItem(
        iconKey: json['icon'] ?? 'eco',
        title: json['title'] ?? '',
        subtitle: json['subtitle'] ?? '',
      );
}

class DashboardData {
  final int pointBalance; // saldo poin
  final int rupiahValue; // setara rupiah
  final double totalWasteKg; // total sampah
  final double co2ReducedKg; // CO2 reduksi
  final List<ImpactItem> impacts;

  const DashboardData({
    required this.pointBalance,
    required this.rupiahValue,
    required this.totalWasteKg,
    required this.co2ReducedKg,
    required this.impacts,
  });

  factory DashboardData.fromJson(Map<String, dynamic> json) => DashboardData(
        pointBalance: json['point_balance'] ?? 0,
        rupiahValue: json['rupiah_value'] ?? 0,
        totalWasteKg: (json['total_waste_kg'] ?? 0).toDouble(),
        co2ReducedKg: (json['co2_reduced_kg'] ?? 0).toDouble(),
        impacts: (json['impacts'] as List? ?? [])
            .map((e) => ImpactItem.fromJson(e))
            .toList(),
      );
}
