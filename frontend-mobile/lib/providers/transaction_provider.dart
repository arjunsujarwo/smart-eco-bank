import 'package:flutter/foundation.dart';
import '../models/transaction.dart';
import '../services/api_service.dart';

class TransactionProvider extends ChangeNotifier {
  final _api = ApiService.instance;

  List<TransactionModel> items = [];
  bool loading = false;
  String filter = 'all';

  Future<void> load([String? newFilter]) async {
    if (newFilter != null) filter = newFilter;
    loading = true;
    notifyListeners();
    items = await _api.getTransactions(filter: filter);
    loading = false;
    notifyListeners();
  }
}
