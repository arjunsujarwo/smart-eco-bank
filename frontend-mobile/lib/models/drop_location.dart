/// Lokasi posko drop-off untuk layar Locations (M3).
class DropLocation {
  final String id;
  final String name;
  final String address;
  final double distanceKm;
  final String openInfo; // "Buka hingga 21:00" / "Buka besok jam 08:00"
  final bool isOpen;
  final double lat;
  final double lng;

  const DropLocation({
    required this.id,
    required this.name,
    required this.address,
    required this.distanceKm,
    required this.openInfo,
    required this.isOpen,
    this.lat = 0,
    this.lng = 0,
  });

  factory DropLocation.fromJson(Map<String, dynamic> json) => DropLocation(
        id: json['id']?.toString() ?? '',
        name: json['name'] ?? '',
        address: json['address'] ?? '',
        distanceKm: (json['distance_km'] ?? 0).toDouble(),
        openInfo: json['open_info'] ?? '',
        isOpen: json['is_open'] ?? false,
        lat: (json['lat'] ?? 0).toDouble(),
        lng: (json['lng'] ?? 0).toDouble(),
      );
}
