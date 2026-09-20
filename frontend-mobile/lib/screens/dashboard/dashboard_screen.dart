import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../widgets/icon_mapper.dart';
import '../notifications/notifications_screen.dart';
import '../customer_service/customer_service_screen.dart';
import '../scanner/scanner_screen.dart';

/// M2 - Beranda. Kartu poin, statistik, tombol SETOR, daftar dampak.
class DashboardScreen extends StatefulWidget {
  /// Untuk pindah tab (mis. ke Rewards) dari shell.
  final void Function(int index)? onNavigateTab;
  const DashboardScreen({super.key, this.onNavigateTab});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _rupiah =
      NumberFormat.currency(locale: 'id', symbol: 'Rp ', decimalDigits: 0);
  final _num = NumberFormat.decimalPattern('id');

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
        (_) => context.read<DashboardProvider>().load());
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final dash = context.watch<DashboardProvider>();
    final data = dash.data;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            _header(auth.user?.fullName ?? 'Pengguna'),
            Expanded(
              child: dash.loading || data == null
                  ? const Center(child: CircularProgressIndicator())
                  : RefreshIndicator(
                      onRefresh: () => dash.load(),
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                        children: [
                          _pointCard(data.pointBalance, data.rupiahValue),
                          const SizedBox(height: 24),
                          _bentoStats(data.totalWasteKg, data.co2ReducedKg),
                          const SizedBox(height: 24),
                          _setorButton(),
                          const SizedBox(height: 24),
                          _impactList(data),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _header(String name) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(
              bottom: BorderSide(color: AppColors.surfaceVariant)),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.primaryContainer, width: 2),
                color: AppColors.surfaceContainer,
              ),
              child: const Icon(Icons.person, color: AppColors.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Selamat Datang,',
                      style: TextStyle(
                          fontSize: 12, color: AppColors.onSurfaceVariant)),
                  Text('Hai, ${name.split(' ').first}!',
                      style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary)),
                ],
              ),
            ),
            _circleIcon(Icons.notifications, () {
              Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => const NotificationsScreen()));
            }),
            const SizedBox(width: 8),
            _circleIcon(Icons.headset_mic, () {
              Navigator.of(context).push(MaterialPageRoute(
                  builder: (_) => const CustomerServiceScreen()));
            }),
          ],
        ),
      );

  Widget _circleIcon(IconData icon, VoidCallback onTap) => InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(100),
        child: Container(
          width: 40,
          height: 40,
          decoration: const BoxDecoration(
              color: AppColors.surfaceContainer, shape: BoxShape.circle),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
      );

  Widget _pointCard(int points, int rupiah) => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: AppColors.ecoGradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.25),
                blurRadius: 20,
                offset: const Offset(0, 8)),
          ],
        ),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Saldo Poin Anda',
                          style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.9),
                              fontSize: 12)),
                      const SizedBox(height: 4),
                      Text('${_num.format(points)} Pts',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 26,
                              fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
                const Icon(Icons.eco, color: AppColors.primaryFixed, size: 28),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(color: Colors.white24, height: 1),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Setara ${_rupiah.format(rupiah)}',
                    style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.85),
                        fontStyle: FontStyle.italic)),
                GestureDetector(
                  onTap: () => widget.onNavigateTab?.call(3),
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(100)),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('Tukar Reward',
                            style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 12)),
                        SizedBox(width: 4),
                        Icon(Icons.arrow_forward,
                            color: Colors.white, size: 16),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      );

  Widget _bentoStats(double waste, double co2) => Row(
        children: [
          Expanded(
              child: _statCard(Icons.recycling, AppColors.primary,
                  'Total Sampah', '${_num.format(waste)} Kg')),
          const SizedBox(width: 16),
          Expanded(
              child: _statCard(Icons.co2, AppColors.secondary, 'CO2 Reduksi',
                  '${_num.format(co2)} Kg')),
        ],
      );

  Widget _statCard(IconData icon, Color color, String label, String value) =>
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceContainerLow,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.surfaceVariant),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color),
            const SizedBox(height: 8),
            Text(label,
                style: const TextStyle(
                    fontSize: 12, color: AppColors.onSurfaceVariant)),
            Text(value,
                style: const TextStyle(
                    fontSize: 22, fontWeight: FontWeight.w600)),
          ],
        ),
      );

  Widget _setorButton() => Column(
        children: [
          GestureDetector(
            onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const ScannerScreen())),
            child: Container(
              width: 128,
              height: 128,
              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      blurRadius: 24,
                      offset: const Offset(0, 8)),
                ],
              ),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.eco, color: Colors.white, size: 44),
                  SizedBox(height: 4),
                  Text('SETOR',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 3)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text('Ketuk untuk mulai menyetor sampah\ndi Posko terdekat',
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: AppColors.onSurfaceVariant,
                  fontWeight: FontWeight.w500)),
        ],
      );

  Widget _impactList(data) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Dampak Lingkunganmu',
                  style:
                      TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              TextButton(onPressed: () {}, child: const Text('Lihat Semua')),
            ],
          ),
          const SizedBox(height: 8),
          ...data.impacts.map<Widget>((item) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceContainerLowest,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.surfaceVariant),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color:
                              AppColors.primaryContainer.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(iconFromKey(item.iconKey),
                            color: AppColors.primary),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(item.title,
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold)),
                            Text(item.subtitle,
                                style: const TextStyle(
                                    fontSize: 12,
                                    color: AppColors.onSurfaceVariant)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              )),
        ],
      );
}
