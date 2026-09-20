import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/dashboard_provider.dart';
import 'providers/transaction_provider.dart';
import 'providers/reward_provider.dart';
import 'providers/location_provider.dart';
import 'providers/notification_provider.dart';
import 'screens/auth/login_screen.dart';

void main() {
  runApp(const LuminaEcoApp());
}

class LuminaEcoApp extends StatelessWidget {
  const LuminaEcoApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Semua ChangeNotifier provider didaftarkan di sini agar state global
    // (user login, dashboard, transaksi, reward, lokasi, notifikasi)
    // dapat diakses dari seluruh widget tree.
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => DashboardProvider()),
        ChangeNotifierProvider(create: (_) => TransactionProvider()),
        ChangeNotifierProvider(create: (_) => RewardProvider()),
        ChangeNotifierProvider(create: (_) => LocationProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
      ],
      child: MaterialApp(
        title: 'Lumina Eco',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        // Alur aplikasi dimulai dari layar login.
        // Setelah login sukses, AuthProvider akan mengarahkan ke MainShell.
        home: const LoginScreen(),
      ),
    );
  }
}
