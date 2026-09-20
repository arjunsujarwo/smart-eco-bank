/// Hasil deteksi AI sampah untuk layar Scanner (M4).
class ScanResult {
  final String depositorName;
  final String locationName;
  final String detectedProduct;
  final String category; // Organik / Anorganik
  final String materialType; // "PET 01"
  final double confidence; // 0..100

  const ScanResult({
    required this.depositorName,
    required this.locationName,
    required this.detectedProduct,
    required this.category,
    required this.materialType,
    required this.confidence,
  });

  factory ScanResult.fromJson(Map<String, dynamic> json) => ScanResult(
        depositorName: json['depositor_name'] ?? '',
        locationName: json['location_name'] ?? '',
        detectedProduct: json['detected_product'] ?? '',
        category: json['category'] ?? '',
        materialType: json['material_type'] ?? '',
        confidence: (json['confidence'] ?? 0).toDouble(),
      );
}
