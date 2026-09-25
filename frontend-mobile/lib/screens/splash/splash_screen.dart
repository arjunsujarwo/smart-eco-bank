import 'package:flutter/material.dart';
import '../../services/onboarding_preferences.dart';
import '../../theme/app_colors.dart';
import '../auth/login_screen.dart';
import '../onboarding/onboarding_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fade;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 950),
    );
    _fade = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
    _scale = Tween<double>(begin: 0.86, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );
    _controller.forward();
    _openNext();
  }

  Future<void> _openNext() async {
    final completed = await OnboardingPreferences.isCompleted();
    final fastAnimations = MediaQueryData.fromView(
            WidgetsBinding.instance.platformDispatcher.views.first)
        .disableAnimations;
    await Future<void>.delayed(
      Duration(milliseconds: fastAnimations ? 250 : 1550),
    );
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        transitionDuration: Duration(milliseconds: fastAnimations ? 0 : 350),
        pageBuilder: (_, animation, __) =>
            completed ? const LoginScreen() : const OnboardingScreen(),
        transitionsBuilder: (_, animation, __, child) =>
            FadeTransition(opacity: animation, child: child),
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: Container(
          decoration: const BoxDecoration(gradient: AppColors.ecoGradient),
          child: Stack(
            children: [
              Positioned(
                top: -90,
                right: -50,
                child: _orb(230, Colors.white.withValues(alpha: 0.08)),
              ),
              Positioned(
                bottom: -100,
                left: -80,
                child: _orb(260, Colors.white.withValues(alpha: 0.06)),
              ),
              Center(
                child: FadeTransition(
                  opacity: _fade,
                  child: ScaleTransition(
                    scale: _scale,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 92,
                          height: 92,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.16),
                            shape: BoxShape.circle,
                            border: Border.all(
                                color: Colors.white.withValues(alpha: 0.28)),
                          ),
                          child: const Icon(Icons.eco,
                              size: 52, color: Colors.white),
                        ),
                        const SizedBox(height: 22),
                        const Text('Lumina Eco',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 30,
                                fontWeight: FontWeight.w700,
                                letterSpacing: -0.5)),
                        const SizedBox(height: 8),
                        Text('Banking yang berdampak baik',
                            style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.86),
                                fontSize: 14)),
                      ],
                    ),
                  ),
                ),
              ),
              Positioned(
                bottom: 34,
                left: 0,
                right: 0,
                child: Text('SMART • SUSTAINABLE • SIMPLE',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.68),
                        fontSize: 10,
                        letterSpacing: 1.8,
                        fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ),
      );

  Widget _orb(double size, Color color) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      );
}
