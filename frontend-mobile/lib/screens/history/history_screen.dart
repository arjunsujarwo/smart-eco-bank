import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../theme/app_colors.dart';
import '../../models/transaction.dart';
import '../../providers/transaction_provider.dart';

/// M5 - Riwayat Transaksi. Filter tab + kartu transaksi dengan status.
class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final _num = NumberFormat.decimalPattern('id');
  final _filters = const {
    'all': 'Semua',
    'deposit': 'Setoran Sampah',
    'redeem': 'Tukar Poin',
  };

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
        (_) => context.read<TransactionProvider>().load());
  }

  @override
  Widget build(BuildContext context) {
    final prov = context.watch<TransactionProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Riwayat Transaksi Saya',
            style: TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
                fontSize: 20)),
      ),
      body: Column(
        children: [
          SizedBox(
            height: 56,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: _filters.entries.map((e) {
                final active = prov.filter == e.key;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(e.value),
                    selected: active,
                    showCheckmark: false,
                    selectedColor: AppColors.primary,
                    backgroundColor: AppColors.surfaceContainer,
                    labelStyle: TextStyle(
                        color: active
                            ? AppColors.onPrimary
                            : AppColors.onSurfaceVariant,
                        fontWeight: FontWeight.w500),
                    onSelected: (_) => prov.load(e.key),
                  ),
                );
              }).toList(),
            ),
          ),
          Expanded(
            child: prov.loading
                ? const Center(child: CircularProgressIndicator())
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      ...prov.items.map(_txCard),
                      const SizedBox(height: 24),
                      Center(
                        child: Opacity(
                          opacity: 0.4,
                          child: Column(
                            children: [
                              Container(
                                width: 96,
                                height: 4,
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceVariant,
                                  borderRadius: BorderRadius.circular(100),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text('Riwayat 30 Hari Terakhir',
                                  style: TextStyle(
                                      fontSize: 12,
                                      color: AppColors.onSurfaceVariant)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _txCard(TransactionModel tx) {
    final isDeposit = tx.type == TxType.deposit;
    final (badgeBg, badgeFg) = switch (tx.status) {
      TxStatus.pending => (
          AppColors.tertiaryContainer.withValues(alpha: 0.2),
          AppColors.tertiary
        ),
      TxStatus.success => (
          AppColors.primaryContainer.withValues(alpha: 0.2),
          AppColors.primary
        ),
      TxStatus.failed => (
          AppColors.errorContainer,
          AppColors.onErrorContainer
        ),
    };

    final pointText = tx.isEstimate
        ? 'Estimasi ${_num.format(tx.points)} Pts'
        : '${tx.points >= 0 ? '+' : ''}${_num.format(tx.points)} Pts';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.surfaceVariant),
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: (isDeposit
                          ? AppColors.primaryContainer
                          : AppColors.tertiaryContainer)
                      .withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(isDeposit ? Icons.recycling : Icons.redeem,
                    color: isDeposit ? AppColors.primary : AppColors.tertiary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(tx.title,
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                    Text('${tx.poskoName} • ${tx.time}',
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.onSurfaceVariant)),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: badgeBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(tx.status.label,
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: badgeFg)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Divider(height: 1, color: AppColors.surfaceVariant),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(tx.detail,
                  style: const TextStyle(color: AppColors.onSurfaceVariant)),
              Text(pointText,
                  style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: tx.status == TxStatus.success
                          ? AppColors.primary
                          : AppColors.onSurface)),
            ],
          ),
        ],
      ),
    );
  }
}
