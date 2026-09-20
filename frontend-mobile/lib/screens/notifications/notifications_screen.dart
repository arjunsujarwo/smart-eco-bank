import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/app_colors.dart';
import '../../models/app_notification.dart';
import '../../providers/notification_provider.dart';
import '../../widgets/icon_mapper.dart';

/// M8 - Notifikasi. Daftar dikelompokkan per "Terbaru" / "Kemarin".
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
        (_) => context.read<NotificationProvider>().load());
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<NotificationProvider>();

    // Kelompokkan berdasarkan field group.
    final groups = <String, List<AppNotification>>{};
    for (final n in prov.items) {
      groups.putIfAbsent(n.group, () => []).add(n);
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.of(context).maybePop()),
        title: const Text('Notifikasi',
            style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
                fontSize: 20)),
        actions: const [
          Icon(Icons.more_vert, color: AppColors.onSurfaceVariant),
          SizedBox(width: 8),
        ],
      ),
      body: prov.loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                for (final entry in groups.entries) ...[
                  Padding(
                    padding: const EdgeInsets.only(top: 8, bottom: 12),
                    child: Text(entry.key.toUpperCase(),
                        style: TextStyle(
                            fontSize: 12,
                            letterSpacing: 1,
                            color: AppColors.outline)),
                  ),
                  ...entry.value.map(_card),
                ],
                const SizedBox(height: 48),
                Center(
                  child: Opacity(
                    opacity: 0.2,
                    child: Column(
                      children: const [
                        Icon(Icons.notifications_paused, size: 56),
                        SizedBox(height: 8),
                        Text('Semua kabar terbaru sudah dibaca',
                            style: TextStyle(fontSize: 12)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _card(AppNotification n) => Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: n.read
              ? AppColors.surfaceContainerLow.withValues(alpha: 0.5)
              : AppColors.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
              color: AppColors.surfaceVariant.withValues(alpha: 0.3)),
          boxShadow: n.read
              ? null
              : const [BoxShadow(color: Colors.black12, blurRadius: 8)],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: _bgFor(n.iconKey),
                shape: BoxShape.circle,
              ),
              child: Icon(iconFromKey(n.iconKey),
                  color: _fgFor(n.iconKey), size: 26),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(n.title,
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 16)),
                      ),
                      Text(n.timeAgo,
                          style: const TextStyle(
                              fontSize: 12, color: AppColors.outlineVariant)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(n.body,
                      style: const TextStyle(
                          color: AppColors.onSurfaceVariant, height: 1.3)),
                ],
              ),
            ),
          ],
        ),
      );

  Color _bgFor(String key) {
    switch (key) {
      case 'check_circle':
        return AppColors.primaryContainer.withValues(alpha: 0.2);
      case 'verified':
        return AppColors.secondaryContainer.withValues(alpha: 0.2);
      case 'card_giftcard':
        return AppColors.tertiaryContainer.withValues(alpha: 0.2);
      default:
        return AppColors.outlineVariant.withValues(alpha: 0.1);
    }
  }

  Color _fgFor(String key) {
    switch (key) {
      case 'check_circle':
        return AppColors.primary;
      case 'verified':
        return AppColors.secondary;
      case 'card_giftcard':
        return AppColors.tertiary;
      default:
        return AppColors.outline;
    }
  }
}
