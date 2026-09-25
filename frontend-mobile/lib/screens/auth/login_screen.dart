import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/app_text_field.dart';
import 'register_screen.dart';
import '../main_shell.dart';

/// M1 - Login. "Masuk ke Akun Anda".
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController(text: 'budi@email.com');
  final _password = TextEditingController(text: 'password');
  bool _obscure = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final auth = context.read<AuthProvider>();
    final ok = await auth.login(_email.text.trim(), _password.text);
    if (!mounted) return;
    if (ok) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const MainShell()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error ?? 'Login gagal')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final loading = context.watch<AuthProvider>().loading;

    return Scaffold(
      body: Stack(
        children: [
          // Dekorasi blur di belakang.
          Positioned(
            top: -120,
            right: -80,
            child: _blurBlob(
                280, AppColors.primaryContainer.withValues(alpha: 0.25)),
          ),
          Positioned(
            bottom: -120,
            left: -80,
            child: _blurBlob(220, AppColors.secondary.withValues(alpha: 0.15)),
          ),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Container(
                  constraints: const BoxConstraints(maxWidth: 440),
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.9),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                        color: AppColors.outlineVariant.withValues(alpha: 0.4)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 24,
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      _branding(),
                      const SizedBox(height: 28),
                      const Text(
                        'Masuk ke Akun Anda',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Kelola aset hijau dan transaksi finansial Anda dalam satu genggaman.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppColors.onSurfaceVariant),
                      ),
                      const SizedBox(height: 28),
                      AppTextField(
                        label: 'Email',
                        hint: 'nama@email.com',
                        icon: Icons.mail_outline,
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                      ),
                      const SizedBox(height: 16),
                      AppTextField(
                        label: 'Password',
                        hint: '••••••••',
                        icon: Icons.lock_outline,
                        obscure: _obscure,
                        controller: _password,
                        suffix: IconButton(
                          icon: Icon(_obscure
                              ? Icons.visibility
                              : Icons.visibility_off),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: () {},
                          child: const Text('Lupa Password?'),
                        ),
                      ),
                      const SizedBox(height: 8),
                      PrimaryButton(
                        label: 'Masuk',
                        icon: Icons.arrow_forward,
                        loading: loading,
                        onPressed: _submit,
                      ),
                      const SizedBox(height: 24),
                      _divider(),
                      const SizedBox(height: 24),
                      _socialButtons(),
                      const SizedBox(height: 24),
                      _footer(),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _branding() => Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              gradient: AppColors.ecoGradient,
              borderRadius: BorderRadius.circular(16),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.asset(
                'assets/images/smart_eco_bank_logo.png',
                fit: BoxFit.cover,
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Smart Eco Bank',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w600,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'SMART SUSTAINABLE BANKING',
            style: TextStyle(
              fontSize: 11,
              letterSpacing: 2,
              color: AppColors.onSurfaceVariant,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      );

  Widget _divider() => Row(
        children: [
          const Expanded(child: Divider(color: AppColors.outlineVariant)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text('Atau masuk dengan',
                style:
                    TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
          ),
          const Expanded(child: Divider(color: AppColors.outlineVariant)),
        ],
      );

  Widget _socialButtons() => Row(
        children: [
          Expanded(child: _socialBtn('Google', Icons.g_mobiledata)),
          const SizedBox(width: 16),
          Expanded(child: _socialBtn('Facebook', Icons.facebook)),
        ],
      );

  Widget _socialBtn(String label, IconData icon) => OutlinedButton.icon(
        onPressed: () {},
        icon: Icon(icon, color: AppColors.onSurface),
        label: Text(label,
            style: const TextStyle(
                color: AppColors.onSurface, fontWeight: FontWeight.w600)),
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 14),
          backgroundColor: AppColors.surfaceContainerLow,
          side: const BorderSide(color: AppColors.outlineVariant),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );

  Widget _footer() => Wrap(
        alignment: WrapAlignment.center,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          const Text('Belum punya akun? ',
              style: TextStyle(color: AppColors.onSurfaceVariant)),
          GestureDetector(
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const RegisterScreen()),
            ),
            child: const Text('Daftar di sini',
                style: TextStyle(
                    color: AppColors.primary, fontWeight: FontWeight.bold)),
          ),
        ],
      );

  Widget _blurBlob(double size, Color color) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      );
}
