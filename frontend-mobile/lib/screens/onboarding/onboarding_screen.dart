import 'package:flutter/material.dart';
import '../../services/onboarding_preferences.dart';
import '../../theme/app_colors.dart';
import '../auth/login_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({
    super.key,
    this.replay = false,
  });

  final bool replay;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _pages = const [
    _OnboardingPage(
      icon: Icons.account_balance_wallet_outlined,
      eyebrow: 'MULAI DENGAN MUDAH',
      title: 'Satu rekening,\nbanyak kebaikan',
      description:
          'Kelola finansial dan kontribusi hijaumu dalam satu pengalaman perbankan yang sederhana.',
      color: AppColors.primary,
    ),
    _OnboardingPage(
      icon: Icons.recycling_outlined,
      eyebrow: 'SETIAP AKSI BERARTI',
      title: 'Ubah kebiasaan\njadi dampak',
      description:
          'Pantau jejak karbon, setor sampah, dan temukan cara baru untuk hidup lebih berkelanjutan.',
      color: AppColors.secondary,
    ),
    _OnboardingPage(
      icon: Icons.auto_awesome_outlined,
      eyebrow: 'TUMBUH BERSAMA',
      title: 'Hadiah untuk\npilihan baikmu',
      description:
          'Kumpulkan poin dari aksi hijaumu dan tukarkan dengan berbagai reward yang bermakna.',
      color: AppColors.tertiary,
    ),
  ];
  final _pageController = PageController();
  int _currentPage = 0;

  bool get _isLastPage => _currentPage == _pages.length - 1;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await OnboardingPreferences.markCompleted();
    if (!mounted) return;
    if (widget.replay) {
      Navigator.of(context).pop();
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  void _next() {
    if (_isLastPage) {
      _finish();
    } else {
      final reducedMotion = MediaQuery.of(context).disableAnimations;
      if (reducedMotion) {
        _pageController.jumpToPage(_currentPage + 1);
      } else {
        _pageController.nextPage(
          duration: const Duration(milliseconds: 320),
          curve: Curves.easeOutCubic,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final reducedMotion = MediaQuery.of(context).disableAnimations;
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  if (widget.replay)
                    IconButton(
                      tooltip: 'Kembali',
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.arrow_back),
                    ),
                  const Spacer(),
                  TextButton(
                    onPressed: _finish,
                    child: const Text('Lewati'),
                  ),
                ],
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                itemCount: _pages.length,
                onPageChanged: (page) => setState(() => _currentPage = page),
                itemBuilder: (_, index) => _PageView(page: _pages[index]),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      _pages.length,
                      (index) => AnimatedContainer(
                        duration: reducedMotion
                            ? Duration.zero
                            : const Duration(milliseconds: 250),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: index == _currentPage ? 24 : 7,
                        height: 7,
                        decoration: BoxDecoration(
                          color: index == _currentPage
                              ? AppColors.primary
                              : AppColors.outlineVariant,
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Langkah ${_currentPage + 1} dari ${_pages.length}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _next,
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                      ),
                      child: Text(_isLastPage ? 'Mulai sekarang' : 'Lanjut'),
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
}

class _PageView extends StatelessWidget {
  const _PageView({required this.page});

  final _OnboardingPage page;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 28),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 190,
              height: 190,
              decoration: BoxDecoration(
                color: page.color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    width: 136,
                    height: 136,
                    decoration: BoxDecoration(
                      color: page.color.withValues(alpha: 0.14),
                      shape: BoxShape.circle,
                    ),
                  ),
                  Icon(page.icon, size: 76, color: page.color),
                ],
              ),
            ),
            const SizedBox(height: 38),
            Text(page.eyebrow,
                style: TextStyle(
                    color: page.color,
                    fontSize: 11,
                    letterSpacing: 1.5,
                    fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Text(page.title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 30,
                    height: 1.14,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.6)),
            const SizedBox(height: 16),
            Text(page.description,
                textAlign: TextAlign.center,
                style: const TextStyle(
                    fontSize: 15,
                    height: 1.55,
                    color: AppColors.onSurfaceVariant)),
          ],
        ),
      );
}

class _OnboardingPage {
  const _OnboardingPage({
    required this.icon,
    required this.eyebrow,
    required this.title,
    required this.description,
    required this.color,
  });

  final IconData icon;
  final String eyebrow;
  final String title;
  final String description;
  final Color color;
}
