import 'package:flutter/foundation.dart';
import '../models/drop_location.dart';
import '../services/api_service.dart';

class LocationProvider extends ChangeNotifier {
  final _api = ApiService.instance;

  List<DropLocation> items = [];
  bool loading = false;

  Future<void> load({String query = ''}) async {
    loading = true;
    notifyListeners();
    items = await _api.getLocations(query: query);
    loading = false;
    notifyListeners();
  }
}
