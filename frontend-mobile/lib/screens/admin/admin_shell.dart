import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../auth/login_screen.dart';

class AdminShell extends StatefulWidget {
  const AdminShell({super.key});

  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  int _index = 0;

  static const _titles = ['Verifikasi Setoran', 'Pengguna', 'Reward'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_index],
            style: const TextStyle(
                color: AppColors.primary, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            tooltip: 'Keluar',
            onPressed: () => Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const LoginScreen()),
              (_) => false,
            ),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: IndexedStack(
        index: _index,
        children: const [
          _VerificationTab(),
          _UsersTab(),
          _RewardsTab(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(
              icon: Icon(Icons.fact_check_outlined),
              selectedIcon: Icon(Icons.fact_check),
              label: 'Verifikasi'),
          NavigationDestination(
              icon: Icon(Icons.people_outline),
              selectedIcon: Icon(Icons.people),
              label: 'Pengguna'),
          NavigationDestination(
              icon: Icon(Icons.redeem_outlined),
              selectedIcon: Icon(Icons.redeem),
              label: 'Reward'),
        ],
      ),
    );
  }
}

class _VerificationTab extends StatefulWidget {
  const _VerificationTab();

  @override
  State<_VerificationTab> createState() => _VerificationTabState();
}

class _VerificationTabState extends State<_VerificationTab> {
  final _items = <String>['VRF-001 • Budi Santoso', 'VRF-002 • Siti Aminah'];

  void _resolve(String item, bool approved) {
    setState(() => _items.remove(item));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(approved ? '$item disetujui' : '$item ditolak')),
    );
  }

  @override
  Widget build(BuildContext context) => _AdminList(
        emptyText: 'Tidak ada setoran yang menunggu verifikasi.',
        children: _items
            .map((item) => Card(
                  child: ListTile(
                    leading: const CircleAvatar(
                        child: Icon(Icons.recycling_outlined)),
                    title: Text(item),
                    subtitle: const Text('Kertas • 2.5 kg • Menunggu review'),
                    trailing: PopupMenuButton<bool>(
                      onSelected: (approved) => _resolve(item, approved),
                      itemBuilder: (_) => const [
                        PopupMenuItem(value: true, child: Text('Setujui')),
                        PopupMenuItem(value: false, child: Text('Tolak')),
                      ],
                    ),
                  ),
                ))
            .toList(),
      );
}

class _UsersTab extends StatefulWidget {
  const _UsersTab();

  @override
  State<_UsersTab> createState() => _UsersTabState();
}

class _UsersTabState extends State<_UsersTab> {
  final _users = <String>['Budi Santoso', 'Siti Aminah', 'Rizky Pratama'];

  @override
  Widget build(BuildContext context) => _AdminList(
        children: _users
            .map((user) => Card(
                  child: ListTile(
                    leading: const CircleAvatar(child: Icon(Icons.person)),
                    title: Text(user),
                    subtitle: const Text('Pengguna aktif'),
                    trailing: OutlinedButton(
                      onPressed: () => ScaffoldMessenger.of(context)
                          .showSnackBar(
                              SnackBar(content: Text('$user ditangguhkan'))),
                      child: const Text('Tangguhkan'),
                    ),
                  ),
                ))
            .toList(),
      );
}

class _RewardsTab extends StatefulWidget {
  const _RewardsTab();

  @override
  State<_RewardsTab> createState() => _RewardsTabState();
}

class _RewardsTabState extends State<_RewardsTab> {
  final _rewards = <String>['Tumbler Reusable', 'Bibit Tanaman', 'Tas Belanja'];

  @override
  Widget build(BuildContext context) => _AdminList(
        children: _rewards
            .map((reward) => Card(
                  child: ListTile(
                    leading: const CircleAvatar(
                        child: Icon(Icons.card_giftcard_outlined)),
                    title: Text(reward),
                    subtitle: const Text('Status: Aktif • Kelola katalog'),
                    trailing: Switch(
                      value: true,
                      onChanged: (_) => ScaffoldMessenger.of(context)
                          .showSnackBar(
                              SnackBar(content: Text('$reward diperbarui'))),
                    ),
                  ),
                ))
            .toList(),
      );
}

class _AdminList extends StatelessWidget {
  const _AdminList({required this.children, this.emptyText});

  final List<Widget> children;
  final String? emptyText;

  @override
  Widget build(BuildContext context) => ListView(
        padding: const EdgeInsets.all(16),
        children: children.isEmpty
            ? [
                Center(
                    child: Padding(
                        padding: const EdgeInsets.all(48),
                        child: Text(emptyText ?? 'Belum ada data.')))
              ]
            : children,
      );
}
