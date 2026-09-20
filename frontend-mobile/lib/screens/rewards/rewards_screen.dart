import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../theme/app_colors.dart';
import '../../models/reward.dart';
import '../../providers/reward_provider.dart';
import '../../providers/auth_provider.dart';

/// M6 - Katalog Reward + overlay sukses penukaran.
class RewardsScreen extends StatefulWidget {
  const RewardsScreen({super.key});

  @override
  State<RewardsScreen> createState() => _RewardsScreenState();
}

class _RewardsScreenState extends State<RewardsScreen> {
  final _num = NumberFormat.decimalPattern('id');

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
        (_) => context.read<RewardProvider>().load());
  }

  Future<void> _redeem(RewardModel r) async {
    final ok = await context.read<RewardProvider>().redeem(r.id);
    if (!mounted) return;
    if (ok) _showSuccess();
  }

  void _showSuccess() {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.white,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: const BoxDecoration(
                  color: AppColors.primaryContainer,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle,
                    color: AppColors.onPrimaryContainer, size: 48),
              ),
              const SizedBox(height: 24),
              const Text('Penukaran Sukses!',
                  style:
                      TextStyle(fontSize: 22, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              const Text(
                'Poin Anda telah dipotong. Produk akan segera dikirimkan ke alamat Anda.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.onSurfaceVariant),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Selesai'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<RewardProvider>();
    final points = context.watch<AuthProvider>().user?.pointBalance ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Smart Eco Bank',
            style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
                fontSize: 20)),
        actions: const [
          Icon(Icons.chat, color: AppColors.primary),
          SizedBox(width: 16),
          Icon(Icons.notifications, color: AppColors.primary),
          SizedBox(width: 16),
        ],
      ),
      body: prov.loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                const Text('Tukar Poin Anda',
                    style:
                        TextStyle(fontSize: 28, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.primaryContainer,
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.stars,
                          size: 18, color: AppColors.onPrimaryContainer),
                      const SizedBox(width: 6),
                      Text('Sisa Poin: ${_num.format(points)} Pts',
                          style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: AppColors.onPrimaryContainer)),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 24,
                  crossAxisSpacing: 24,
                  childAspectRatio: 0.72,
                  children: prov.items.map(_rewardCard).toList(),
                ),
              ],
            ),
    );
  }

  Widget _rewardCard(RewardModel r) {
    if (r.comingSoon) {
      return Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceVariant,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
              color: AppColors.outline,
              style: BorderStyle.solid,
              width: 1),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.inventory_2,
                  size: 40, color: AppColors.outline),
              const SizedBox(height: 8),
              Text('Produk baru\nsegera hadir',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      fontSize: 12, color: AppColors.onSurfaceVariant)),
            ],
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.outlineVariant),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              width: double.infinity,
              color: Colors.white,
              child: const Icon(Icons.card_giftcard,
                  size: 56, color: AppColors.primaryContainer),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(r.name,
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text('${_num.format(r.pointCost)} pts',
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.primary)),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: () => _redeem(r),
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Produk'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
