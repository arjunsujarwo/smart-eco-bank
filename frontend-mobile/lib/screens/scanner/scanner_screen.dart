import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/app_colors.dart';
import '../../models/scan_result.dart';
import '../../services/api_service.dart';
import '../../providers/transaction_provider.dart';
import '../../widgets/primary_button.dart';

/// M4 - AI Waste Detection. Animasi scan -> hasil deteksi -> input berat -> poin.
class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen>
    with SingleTickerProviderStateMixin {
  final _api = ApiService.instance;
  final _weight = TextEditingController();
  late final AnimationController _scanCtrl;

  ScanResult? _result;
  bool _scanning = true;
  bool _submitting = false;
  double _points = 0;

  @override
  void initState() {
    super.initState();
    _scanCtrl = AnimationController(
        vsync: this, duration: const Duration(seconds: 3))
      ..repeat();
    _weight.addListener(_recalc);
    _runScan();
  }

  Future<void> _runScan() async {
    setState(() {
      _scanning = true;
      _result = null;
    });
    final res = await _api.analyzeWaste();
    if (!mounted) return;
    setState(() {
      _result = res;
      _scanning = false;
    });
  }

  void _recalc() {
    final grams = double.tryParse(_weight.text) ?? 0;
    setState(() => _points = _api.estimatePoints(grams));
  }

  Future<void> _submit() async {
    if (_result == null) return;
    setState(() => _submitting = true);
    final grams = double.tryParse(_weight.text) ?? 0;
    await _api.submitDeposit(category: _result!.category, grams: grams);
    if (!mounted) return;
    // Refresh riwayat agar transaksi baru muncul.
    context.read<TransactionProvider>().load();
    setState(() => _submitting = false);
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        icon: const Icon(Icons.check_circle,
            color: AppColors.primary, size: 48),
        title: const Text('Setoran Terkirim'),
        content: const Text(
            'Poin akan dikreditkan setelah verifikasi fisik di Posko.'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).maybePop();
            },
            child: const Text('Selesai'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _scanCtrl.dispose();
    _weight.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
            icon: const Icon(Icons.close, color: AppColors.onSurface),
            onPressed: () => Navigator.of(context).maybePop()),
        title: const Text('AI Scanner',
            style: TextStyle(
                color: AppColors.primary, fontWeight: FontWeight.w600)),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _cameraPreview(),
          const SizedBox(height: 24),
          _scanDataSection(),
          const SizedBox(height: 16),
          PrimaryButton(
            label: 'Kirim Setor',
            icon: Icons.send,
            gradient: false,
            loading: _submitting,
            onPressed: _result == null ? null : _submit,
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _runScan,
            icon: const Icon(Icons.refresh),
            label: const Text('Ulangi Scan'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              foregroundColor: AppColors.onSurface,
              side: const BorderSide(color: AppColors.surfaceVariant),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 16),
          const Center(
            child: Text('Poin akan dikreditkan setelah verifikasi fisik di Posko.',
                textAlign: TextAlign.center,
                style:
                    TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
          ),
        ],
      ),
    );
  }

  Widget _cameraPreview() => AspectRatio(
        aspectRatio: 1,
        child: Container(
          decoration: BoxDecoration(
            color: const Color(0xFF191C1D),
            borderRadius: BorderRadius.circular(24),
          ),
          clipBehavior: Clip.antiAlias,
          child: Stack(
            children: [
              // Placeholder kamera (di app nyata diganti CameraPreview).
              const Center(
                child: Icon(Icons.recycling, size: 120, color: Colors.white24),
              ),
              // Target box.
              Positioned.fill(
                child: Padding(
                  padding: const EdgeInsets.all(48),
                  child: Container(
                    decoration: BoxDecoration(
                      border: Border.all(
                          color: AppColors.primaryFixed, width: 2),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Align(
                      alignment: Alignment.topLeft,
                      child: Container(
                        margin: const EdgeInsets.all(8),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.primaryContainer,
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.psychology,
                                size: 16, color: AppColors.onPrimaryContainer),
                            const SizedBox(width: 6),
                            Text(_scanning ? 'AI ANALYZING...' : 'TERDETEKSI',
                                style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.onPrimaryContainer)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              // Scan line animasi.
              if (_scanning)
                AnimatedBuilder(
                  animation: _scanCtrl,
                  builder: (context, _) => Align(
                    alignment: Alignment(0, (_scanCtrl.value * 2) - 1),
                    child: Container(
                      height: 2,
                      decoration: BoxDecoration(
                        color: AppColors.primaryFixed,
                        boxShadow: [
                          BoxShadow(
                              color: AppColors.primaryFixed
                                  .withValues(alpha: 0.8),
                              blurRadius: 12),
                        ],
                      ),
                    ),
                  ),
                ),
              // Floating data: confidence & type.
              if (_result != null)
                Positioned(
                  left: 24,
                  right: 24,
                  bottom: 24,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _floatData('Confidence', '${_result!.confidence}%'),
                      _floatData('Type', _result!.materialType, end: true),
                    ],
                  ),
                ),
            ],
          ),
        ),
      );

  Widget _floatData(String label, String value, {bool end = false}) =>
      Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.6),
          borderRadius: BorderRadius.circular(12),
          border:
              Border.all(color: AppColors.outlineVariant.withValues(alpha: 0.3)),
        ),
        child: Column(
          crossAxisAlignment:
              end ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(label,
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7), fontSize: 11)),
            Text(value,
                style: const TextStyle(
                    color: AppColors.primaryFixed,
                    fontSize: 22,
                    fontWeight: FontWeight.w600)),
          ],
        ),
      );

  Widget _scanDataSection() {
    if (_result == null) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: Center(child: Text('Menganalisis sampah...')),
      );
    }
    final r = _result!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: const [
            Icon(Icons.verified, color: AppColors.primary),
            SizedBox(width: 8),
            Text('Data Hasil Scan',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600)),
          ],
        ),
        const SizedBox(height: 16),
        _lockedField('Nama Penyetor', r.depositorName),
        _lockedField('Lokasi Setor', r.locationName,
            icon: Icons.location_on),
        _highlightField('Produk Terdeteksi', r.detectedProduct),
        _lockedField('Kategori Sampah', r.category, showLock: false),
        const SizedBox(height: 4),
        _weightField(),
        const SizedBox(height: 16),
        _pointsDisplay(),
      ],
    );
  }

  Widget _lockedField(String label, String value,
          {IconData? icon, bool showLock = true}) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 6),
              child: Text(label,
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.onSurfaceVariant)),
            ),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLow,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.surfaceVariant),
              ),
              child: Row(
                children: [
                  if (icon != null) ...[
                    Icon(icon, color: AppColors.onSurfaceVariant, size: 20),
                    const SizedBox(width: 12),
                  ],
                  Expanded(child: Text(value)),
                  if (showLock)
                    const Icon(Icons.lock,
                        color: AppColors.onSurfaceVariant, size: 18),
                ],
              ),
            ),
          ],
        ),
      );

  Widget _highlightField(String label, String value) => Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 6),
              child: Text(label,
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.onSurfaceVariant)),
            ),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primaryContainer.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border:
                    Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.eco, color: AppColors.primary),
                  const SizedBox(width: 12),
                  Text(value),
                ],
              ),
            ),
          ],
        ),
      );

  Widget _weightField() => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(left: 4, bottom: 6),
            child: Text('Berat Sampah (Gram)',
                style: TextStyle(
                    fontSize: 12, color: AppColors.onSurfaceVariant)),
          ),
          TextField(
            controller: _weight,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              hintText: '0',
              suffixText: 'Gram',
            ),
          ),
        ],
      );

  Widget _pointsDisplay() => Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.primaryContainer.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: const [
                Icon(Icons.stars, color: AppColors.primary),
                SizedBox(width: 12),
                Text('Estimasi Poin'),
              ],
            ),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  _points == _points.floor()
                      ? _points.toInt().toString()
                      : _points.toStringAsFixed(1),
                  style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary),
                ),
                const SizedBox(width: 4),
                const Padding(
                  padding: EdgeInsets.only(bottom: 4),
                  child: Text('Poin',
                      style: TextStyle(
                          fontSize: 12, color: AppColors.primary)),
                ),
              ],
            ),
          ],
        ),
      );
}
