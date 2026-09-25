import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../auth/login_screen.dart';
import '../onboarding/onboarding_screen.dart';

/// M7 - Pengaturan. Profil, daftar setting, kartu dampak hijau, logout.
class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  Future<void> _logout(BuildContext context) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Keluar'),
        content: const Text('Apakah Anda yakin ingin keluar?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Batal')),
          FilledButton(
              style: FilledButton.styleFrom(backgroundColor: AppColors.error),
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Keluar')),
        ],
      ),
    );
    if (confirm != true) return;
    if (!context.mounted) return;
    await context.read<AuthProvider>().logout();
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pengaturan',
            style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
                fontSize: 20)),
        actions: const [
          Icon(Icons.more_vert, color: AppColors.onSurfaceVariant),
          SizedBox(width: 8),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profil.
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerLow,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                  color: AppColors.outlineVariant.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                Stack(
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.surfaceContainer,
                        border: Border.all(
                            color: AppColors.primaryContainer, width: 2),
                      ),
                      child: const Icon(Icons.person, color: AppColors.primary),
                    ),
                    Positioned(
                      bottom: -2,
                      right: -2,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                          border: Border.all(
                              color: AppColors.surfaceContainerLow, width: 2),
                        ),
                        child: const Icon(Icons.edit,
                            size: 14, color: Colors.white),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.fullName ?? 'Pengguna',
                          style: const TextStyle(
                              fontSize: 22, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color:
                              AppColors.primaryContainer.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: const Text('Ubah Profil',
                            style: TextStyle(
                                fontSize: 12, color: AppColors.primary)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // Daftar setting.
          Padding(
            padding: const EdgeInsets.only(left: 8, bottom: 8),
            child: Text('APLIKASI',
                style: TextStyle(
                    fontSize: 12,
                    letterSpacing: 1,
                    color: AppColors.onSurfaceVariant)),
          ),
          Container(
            decoration: BoxDecoration(
              color: AppColors.surfaceContainerLow,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                  color: AppColors.outlineVariant.withValues(alpha: 0.3)),
            ),
            child: Column(
              children: [
                _tile(Icons.notifications, AppColors.tertiary, 'Notifikasi'),
                const Divider(height: 1, indent: 64),
                _tile(Icons.language, AppColors.primary, 'Bahasa',
                    trailing: 'Indonesia'),
                const Divider(height: 1, indent: 64),
                _tile(Icons.lock, AppColors.secondary, 'Keamanan'),
                const Divider(height: 1, indent: 64),
                _tile(Icons.help_outline, AppColors.primary,
                    'Bantuan & Dukungan'),
                const Divider(height: 1, indent: 64),
                _tile(Icons.menu_book_outlined, AppColors.secondary,
                    'Lihat Panduan Lagi', onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                        builder: (_) => const OnboardingScreen(replay: true)),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // Kartu dampak hijau.
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primaryFixedDim.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                  color: AppColors.primaryContainer.withValues(alpha: 0.3)),
            ),
            child: Stack(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Dampak Hijau',
                        style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w600,
                            color: AppColors.onPrimaryContainer)),
                    const SizedBox(height: 4),
                    Text('Anda telah menghemat 12kg emisi CO2 bulan ini.',
                        style: TextStyle(
                            color: AppColors.onPrimaryContainer
                                .withValues(alpha: 0.8))),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Text(user?.greenLevel ?? 'Level 4: Green Hero',
                          style: const TextStyle(
                              color: Colors.white, fontSize: 12)),
                    ),
                  ],
                ),
                Positioned(
                  right: -16,
                  bottom: -16,
                  child: Opacity(
                    opacity: 0.1,
                    child: Icon(Icons.eco,
                        size: 120, color: AppColors.onPrimaryContainer),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // Logout.
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.errorContainer,
                foregroundColor: AppColors.onErrorContainer,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () => _logout(context),
              icon: const Icon(Icons.logout),
              label: const Text('Keluar'),
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: Text('Smart Eco Bank v2.4.1',
                style:
                    TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
          ),
        ],
      ),
    );
  }

  Widget _tile(IconData icon, Color color, String label,
          {String? trailing, VoidCallback? onTap}) =>
      ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        title: Text(label),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (trailing != null)
              Text(trailing,
                  style: const TextStyle(color: AppColors.onSurfaceVariant)),
            const Icon(Icons.chevron_right, color: AppColors.onSurfaceVariant),
          ],
        ),
        onTap: onTap,
      );
}
