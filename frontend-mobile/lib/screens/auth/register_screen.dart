import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/app_text_field.dart';
import '../main_shell.dart';

/// M1 - Registrasi. "Daftar Akun Baru".
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  final _address = TextEditingController();
  bool _obscure = true;
  bool _agree = false;

  @override
  void dispose() {
    for (final c in [_name, _email, _phone, _password, _confirm, _address]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_agree) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Setujui Syarat & Ketentuan terlebih dahulu.')));
      return;
    }
    if (_password.text != _confirm.text) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Konfirmasi password tidak cocok.')));
      return;
    }
    final auth = context.read<AuthProvider>();
    final ok = await auth.register(
      fullName: _name.text.trim(),
      email: _email.text.trim(),
      phone: _phone.text.trim(),
      password: _password.text,
      address: _address.text.trim(),
    );
    if (!mounted) return;
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Pendaftaran berhasil! Selamat bergabung.')));
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const MainShell()),
        (_) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final loading = context.watch<AuthProvider>().loading;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset(
              'assets/images/smart_eco_bank_logo.png',
              width: 28,
              height: 28,
            ),
            const SizedBox(width: 8),
            const Text('Smart Eco Bank',
                style: TextStyle(
                    color: AppColors.primary, fontWeight: FontWeight.bold)),
          ],
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              const Text('Daftar Akun Baru',
                  style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.5)),
              const SizedBox(height: 8),
              const Text(
                'Bergabunglah dengan ekosistem perbankan hijau untuk masa depan berkelanjutan.',
                style: TextStyle(color: AppColors.onSurfaceVariant),
              ),
              const SizedBox(height: 24),
              AppTextField(
                  label: 'NAMA LENGKAP',
                  hint: 'Contoh: Budi Santoso',
                  icon: Icons.person_outline,
                  controller: _name),
              const SizedBox(height: 16),
              AppTextField(
                  label: 'EMAIL',
                  hint: 'nama@email.com',
                  icon: Icons.mail_outline,
                  controller: _email,
                  keyboardType: TextInputType.emailAddress),
              const SizedBox(height: 16),
              AppTextField(
                  label: 'NOMOR HP',
                  hint: '081234567890',
                  icon: Icons.call_outlined,
                  controller: _phone,
                  keyboardType: TextInputType.phone),
              const SizedBox(height: 16),
              AppTextField(
                label: 'PASSWORD',
                hint: '••••••••',
                icon: Icons.lock_outline,
                obscure: _obscure,
                controller: _password,
                suffix: IconButton(
                  icon:
                      Icon(_obscure ? Icons.visibility : Icons.visibility_off),
                  onPressed: () => setState(() => _obscure = !_obscure),
                ),
              ),
              const SizedBox(height: 16),
              AppTextField(
                  label: 'KONFIRMASI PASSWORD',
                  hint: '••••••••',
                  icon: Icons.lock_reset,
                  obscure: true,
                  controller: _confirm),
              const SizedBox(height: 16),
              AppTextField(
                  label: 'ALAMAT LENGKAP',
                  hint: 'Jl. Hijau No. 123, Jakarta',
                  icon: Icons.location_on_outlined,
                  controller: _address,
                  maxLines: 3),
              const SizedBox(height: 16),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Checkbox(
                    value: _agree,
                    activeColor: AppColors.primary,
                    onChanged: (v) => setState(() => _agree = v ?? false),
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 12),
                      child: RichText(
                        text: const TextSpan(
                          style: TextStyle(
                              color: AppColors.onSurfaceVariant, fontSize: 14),
                          children: [
                            TextSpan(text: 'Saya menyetujui '),
                            TextSpan(
                                text: 'Syarat & Ketentuan',
                                style: TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w600)),
                            TextSpan(text: ' serta '),
                            TextSpan(
                                text: 'Kebijakan Privasi',
                                style: TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w600)),
                            TextSpan(text: ' Smart Eco Bank.'),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              PrimaryButton(
                label: 'Daftar Sekarang',
                gradient: false,
                loading: loading,
                onPressed: _submit,
              ),
              const SizedBox(height: 16),
              Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Sudah memiliki akun? ',
                        style: TextStyle(color: AppColors.onSurfaceVariant)),
                    GestureDetector(
                      onTap: () => Navigator.of(context).maybePop(),
                      child: const Text('Login di sini',
                          style: TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
