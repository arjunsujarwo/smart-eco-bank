/// Item katalog reward untuk layar Rewards (M6).
class RewardModel {
  final String id;
  final String name;
  final int pointCost;
  final String? imageUrl;
  final bool comingSoon;

  const RewardModel({
    required this.id,
    required this.name,
    required this.pointCost,
    this.imageUrl,
    this.comingSoon = false,
  });

  factory RewardModel.fromJson(Map<String, dynamic> json) => RewardModel(
        id: json['id']?.toString() ?? '',
        name: json['name'] ?? '',
        pointCost: json['point_cost'] ?? 0,
        imageUrl: json['image_url'],
        comingSoon: json['coming_soon'] ?? false,
      );
}
