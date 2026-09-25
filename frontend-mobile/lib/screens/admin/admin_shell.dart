import 'package:flutter/material.dart';
import '../../models/admin_data.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';
import '../auth/login_screen.dart';

class AdminShell extends StatefulWidget {
  const AdminShell({super.key});

  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  int _index = 0;
  final _api = ApiService.instance;

  static const _titles = ['Verifikasi Setoran', 'Pengguna', 'Reward'];

  @override
  Widget build(BuildContext context) => Scaffold(
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
          children: [
            _VerificationTab(api: _api),
            _UsersTab(api: _api),
            _RewardsTab(api: _api),
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

class _VerificationTab extends StatefulWidget {
  const _VerificationTab({required this.api});
  final ApiService api;

  @override
  State<_VerificationTab> createState() => _VerificationTabState();
}

class _VerificationTabState extends State<_VerificationTab> {
  late Future<List<AdminVerification>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.api.getAdminVerifications();
  }

  void _reload() =>
      setState(() => _future = widget.api.getAdminVerifications());

  Future<void> _resolve(AdminVerification item, bool approve) async {
    try {
      if (approve) {
        await widget.api.approveAdminVerification(item);
      } else {
        await widget.api.rejectAdminVerification(item.id);
      }
      if (!mounted) return;
      _reload();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(approve ? 'Setoran disetujui' : 'Setoran ditolak')));
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.toString())));
      }
    }
  }

  @override
  Widget build(BuildContext context) => _AsyncList<AdminVerification>(
        future: _future,
        emptyText: 'Tidak ada setoran menunggu verifikasi.',
        itemBuilder: (item) => Card(
          child: ListTile(
            leading: const CircleAvatar(child: Icon(Icons.recycling_outlined)),
            title: Text(item.userName),
            subtitle: Text('${item.category} • ${item.weightGram} gram'),
            trailing: PopupMenuButton<bool>(
              onSelected: (approve) => _resolve(item, approve),
              itemBuilder: (_) => const [
                PopupMenuItem(value: true, child: Text('Setujui')),
                PopupMenuItem(value: false, child: Text('Tolak')),
              ],
            ),
          ),
        ),
      );
}

class _UsersTab extends StatefulWidget {
  const _UsersTab({required this.api});
  final ApiService api;

  @override
  State<_UsersTab> createState() => _UsersTabState();
}

class _UsersTabState extends State<_UsersTab> {
  late Future<List<AdminUser>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.api.getAdminUsers();
  }

  @override
  Widget build(BuildContext context) => _AsyncList<AdminUser>(
        future: _future,
        itemBuilder: (item) => Card(
          child: ListTile(
            leading: const CircleAvatar(child: Icon(Icons.person)),
            title: Text(item.name),
            subtitle: Text('${item.email} • ${item.role}'),
            trailing: item.suspended
                ? const Chip(label: Text('Suspended'))
                : OutlinedButton(
                    onPressed: () async {
                      await widget.api.suspendAdminUser(item.id);
                      if (mounted) {
                        setState(() => _future = widget.api.getAdminUsers());
                      }
                    },
                    child: const Text('Tangguhkan'),
                  ),
          ),
        ),
      );
}

class _RewardsTab extends StatefulWidget {
  const _RewardsTab({required this.api});
  final ApiService api;

  @override
  State<_RewardsTab> createState() => _RewardsTabState();
}

class _RewardsTabState extends State<_RewardsTab> {
  late Future<List<AdminReward>> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.api.getAdminRewards();
  }

  @override
  Widget build(BuildContext context) => _AsyncList<AdminReward>(
        future: _future,
        itemBuilder: (item) => Card(
          child: ListTile(
            leading:
                const CircleAvatar(child: Icon(Icons.card_giftcard_outlined)),
            title: Text(item.name),
            subtitle: Text(
                '${item.points} poin • ${item.active ? 'Aktif' : 'Nonaktif'}'),
          ),
        ),
      );
}

class _AsyncList<T> extends StatelessWidget {
  const _AsyncList({
    required this.future,
    required this.itemBuilder,
    this.emptyText = 'Belum ada data.',
  });

  final Future<List<T>> future;
  final Widget Function(T item) itemBuilder;
  final String emptyText;

  @override
  Widget build(BuildContext context) => FutureBuilder<List<T>>(
        future: future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
                child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text('Gagal memuat data: ${snapshot.error}')));
          }
          final items = snapshot.data ?? const [];
          if (items.isEmpty) return Center(child: Text(emptyText));
          return ListView(
            padding: const EdgeInsets.all(16),
            children: items.map(itemBuilder).toList(),
          );
        },
      );
}
