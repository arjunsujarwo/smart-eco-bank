import 'package:flutter/material.dart';

/// Memetakan nama "Material Symbols" dari mockup HTML ke IconData Flutter.
IconData iconFromKey(String key) {
  switch (key) {
    case 'eco':
      return Icons.eco;
    case 'recycling':
      return Icons.recycling;
    case 'co2':
      return Icons.co2;
    case 'water_drop':
      return Icons.water_drop;
    case 'forest':
      return Icons.forest;
    case 'check_circle':
      return Icons.check_circle;
    case 'verified':
      return Icons.verified;
    case 'card_giftcard':
      return Icons.card_giftcard;
    case 'stars':
      return Icons.stars;
    case 'store':
      return Icons.store;
    case 'location_on':
      return Icons.location_on;
    case 'notifications':
      return Icons.notifications;
    default:
      return Icons.eco;
  }
}
