import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'dashboard/dashboard_screen.dart';
import 'locations/locations_screen.dart';
import 'history/history_screen.dart';
import 'rewards/rewards_screen.dart';
import 'settings/settings_screen.dart';

/// Kerangka utama dengan Bottom Navigation Bar (Home, Locations, Transactions,
/// Rewards, Settings) sesuai komponen bersama di semua mockup.
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  late final List<Widget> _pages = [
    DashboardScreen(onNavigateTab: (i) => setState(() => _index = i)),
    const LocationsScreen(),
    const HistoryScreen(),
    const RewardsScreen(),
    const SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _pages),
      bottomNavigationBar: NavigationBarTheme(
        data: NavigationBarThemeData(
          backgroundColor: AppColors.surface,
          indicatorColor: AppColors.primaryContainer,
          labelTextStyle: WidgetStateProperty.all(
            const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
          ),
        ),
        child: NavigationBar(
          selectedIndex: _index,
          height: 68,
          onDestinationSelected: (i) => setState(() => _index = i),
          destinations: const [
            NavigationDestination(
                icon: Icon(Icons.home_outlined),
                selectedIcon: Icon(Icons.home),
                label: 'Home'),
            NavigationDestination(
                icon: Icon(Icons.location_on_outlined),
                selectedIcon: Icon(Icons.location_on),
                label: 'Locations'),
            NavigationDestination(
                icon: Icon(Icons.receipt_long_outlined),
                selectedIcon: Icon(Icons.receipt_long),
                label: 'Transactions'),
            NavigationDestination(
                icon: Icon(Icons.redeem_outlined),
                selectedIcon: Icon(Icons.redeem),
                label: 'Rewards'),
            NavigationDestination(
                icon: Icon(Icons.settings_outlined),
                selectedIcon: Icon(Icons.settings),
                label: 'Settings'),
          ],
        ),
      ),
    );
  }
}
