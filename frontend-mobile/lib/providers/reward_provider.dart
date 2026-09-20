import 'package:flutter/foundation.dart';
import '../models/reward.dart';
import '../services/api_service.dart';

class RewardProvider extends ChangeNotifier {
  final _api = ApiService.instance;

  List<RewardModel> items = [];
  bool loading = false;

  Future<void> load() async {
    loading = true;
    notifyListeners();
    items = await _api.getRewards();
    loading = false;
    notifyListeners();
  }

  Future<bool> redeem(String id) => _api.redeemReward(id);
}
