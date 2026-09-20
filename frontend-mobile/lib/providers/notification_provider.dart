import 'package:flutter/foundation.dart';
import '../models/app_notification.dart';
import '../services/api_service.dart';

class NotificationProvider extends ChangeNotifier {
  final _api = ApiService.instance;

  List<AppNotification> items = [];
  bool loading = false;

  Future<void> load() async {
    loading = true;
    notifyListeners();
    items = await _api.getNotifications();
    loading = false;
    notifyListeners();
  }
}
