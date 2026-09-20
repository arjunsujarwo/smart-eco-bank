import 'package:flutter/foundation.dart';
import '../models/dashboard_data.dart';
import '../services/api_service.dart';

class DashboardProvider extends ChangeNotifier {
  final _api = ApiService.instance;

  DashboardData? data;
  bool loading = false;

  Future<void> load() async {
    loading = true;
    notifyListeners();
    data = await _api.getDashboard();
    loading = false;
    notifyListeners();
  }
}
