import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/app_colors.dart';
import '../../models/drop_location.dart';
import '../../providers/location_provider.dart';

/// M3 - Lokasi Posko Drop-off. Peta simulasi + daftar lokasi terdekat.
class LocationsScreen extends StatefulWidget {
  const LocationsScreen({super.key});

  @override
  State<LocationsScreen> createState() => _LocationsScreenState();
}

class _LocationsScreenState extends State<LocationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
        (_) => context.read<LocationProvider>().load());
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<LocationProvider>();

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            _header(),
            Expanded(
              child: Stack(
                children: [
                  _simulatedMap(),
                  Positioned(
                    top: 16,
                    left: 16,
                    right: 16,
                    child: _searchBar(),
                  ),
                  // Daftar lokasi sebagai panel bawah.
                  DraggableScrollableSheet(
                    initialChildSize: 0.5,
                    minChildSize: 0.12,
                    maxChildSize: 0.85,
                    builder: (context, controller) => Container(
                      decoration: const BoxDecoration(
                        color: AppColors.surface,
                        borderRadius:
                            BorderRadius.vertical(top: Radius.circular(24)),
                        boxShadow: [
                          BoxShadow(color: Colors.black12, blurRadius: 24)
                        ],
                      ),
                      child: prov.loading
                          ? const Center(child: CircularProgressIndicator())
                          : ListView(
                              controller: controller,
                              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                              children: [
                                Center(
                                  child: Container(
                                    width: 48,
                                    height: 5,
                                    decoration: BoxDecoration(
                                      color: AppColors.surfaceVariant,
                                      borderRadius: BorderRadius.circular(100),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                const Center(
                                  child: Text('DAFTAR LOKASI TERDEKAT',
                                      style: TextStyle(
                                          fontSize: 12,
                                          letterSpacing: 1.5,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.onSurfaceVariant)),
                                ),
                                const SizedBox(height: 16),
                                ...prov.items.map(_locationCard),
                              ],
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _header() => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border:
              Border(bottom: BorderSide(color: AppColors.surfaceVariant)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text('Lokasi Setor Sampah',
                style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary)),
            Text('Temukan titik penukaran sampah terdekat',
                style:
                    TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
          ],
        ),
      );

  Widget _searchBar() => Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(100),
          border: Border.all(color: AppColors.outlineVariant),
          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 12)],
        ),
        child: Row(
          children: [
            const Icon(Icons.search, color: AppColors.outline),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                decoration: const InputDecoration(
                  hintText: 'Cari Lokasi',
                  border: InputBorder.none,
                  filled: false,
                ),
                onSubmitted: (q) =>
                    context.read<LocationProvider>().load(query: q),
              ),
            ),
            const Icon(Icons.filter_list, color: AppColors.outline),
          ],
        ),
      );

  Widget _simulatedMap() => Container(
        color: AppColors.surfaceContainerHigh,
        child: Stack(
          children: [
            // Grid jalan sederhana sebagai placeholder peta.
            CustomPaint(size: Size.infinite, painter: _MapGridPainter()),
            const Positioned(
                top: 140, left: 0, right: 0, child: Center(child: _MapPin())),
            const Positioned(top: 220, right: 80, child: _MapPin()),
            Center(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 200),
                child: Text('Jakarta, Indonesia',
                    style: TextStyle(
                        color: AppColors.outline.withValues(alpha: 0.5),
                        fontSize: 12)),
              ),
            ),
          ],
        ),
      );

  Widget _locationCard(DropLocation loc) {
    final open = loc.isOpen;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.surfaceVariant),
      ),
      child: Opacity(
        opacity: open ? 1 : 0.7,
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: open
                    ? AppColors.primaryContainer.withValues(alpha: 0.2)
                    : AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.store,
                  color: open ? AppColors.primary : AppColors.onSurfaceVariant),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(loc.name,
                            style:
                                const TextStyle(fontWeight: FontWeight.bold)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: open
                              ? AppColors.primaryContainer
                              : AppColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Text(open ? 'Tersedia' : 'Tutup',
                            style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: open
                                    ? AppColors.onPrimaryContainer
                                    : AppColors.onSurfaceVariant)),
                      ),
                    ],
                  ),
                  Text(loc.address,
                      style: const TextStyle(
                          fontSize: 12, color: AppColors.outline)),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(open ? Icons.directions : Icons.history,
                          size: 14,
                          color: open
                              ? AppColors.onSurface
                              : AppColors.error),
                      const SizedBox(width: 4),
                      Text(
                          open
                              ? '${loc.distanceKm} km • ${loc.openInfo}'
                              : loc.openInfo,
                          style: TextStyle(
                              fontSize: 12,
                              color: open
                                  ? AppColors.onSurface
                                  : AppColors.error)),
                    ],
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.outline),
          ],
        ),
      ),
    );
  }
}

class _MapPin extends StatelessWidget {
  const _MapPin();
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.primary,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 2),
          boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 8)],
        ),
        child: const Icon(Icons.eco, color: Colors.white, size: 18),
      );
}

/// Menggambar grid jalan tipis sebagai placeholder peta.
class _MapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white
      ..strokeWidth = 6;
    for (double x = 0; x < size.width; x += 70) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += 90) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
