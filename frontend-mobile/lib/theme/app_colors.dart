import 'package:flutter/material.dart';

/// Token warna diambil langsung dari design system mockup (tailwind config).
/// Semua screen mengacu ke sini supaya konsisten dan gampang di-maintain.
class AppColors {
  AppColors._();

  // Primary
  static const Color primary = Color(0xFF006D37);
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color primaryContainer = Color(0xFF2ECC71);
  static const Color onPrimaryContainer = Color(0xFF005027);
  static const Color primaryFixed = Color(0xFF6BFE9C);
  static const Color primaryFixedDim = Color(0xFF4AE183);
  static const Color onPrimaryFixed = Color(0xFF00210C);

  // Secondary
  static const Color secondary = Color(0xFF485C97);
  static const Color onSecondary = Color(0xFFFFFFFF);
  static const Color secondaryContainer = Color(0xFFA8BCFE);
  static const Color onSecondaryContainer = Color(0xFF364A84);

  // Tertiary
  static const Color tertiary = Color(0xFF735C00);
  static const Color onTertiary = Color(0xFFFFFFFF);
  static const Color tertiaryContainer = Color(0xFFD7AE00);
  static const Color onTertiaryContainer = Color(0xFF544300);

  // Error
  static const Color error = Color(0xFFBA1A1A);
  static const Color onError = Color(0xFFFFFFFF);
  static const Color errorContainer = Color(0xFFFFDAD6);
  static const Color onErrorContainer = Color(0xFF93000A);

  // Surface & background
  static const Color background = Color(0xFFF8F9FA);
  static const Color surface = Color(0xFFF8F9FA);
  static const Color onSurface = Color(0xFF191C1D);
  static const Color onSurfaceVariant = Color(0xFF3D4A3E);
  static const Color surfaceVariant = Color(0xFFE1E3E4);
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  static const Color surfaceContainerLow = Color(0xFFF3F4F5);
  static const Color surfaceContainer = Color(0xFFEDEEEF);
  static const Color surfaceContainerHigh = Color(0xFFE7E8E9);
  static const Color surfaceContainerHighest = Color(0xFFE1E3E4);

  // Outline
  static const Color outline = Color(0xFF6C7B6D);
  static const Color outlineVariant = Color(0xFFBBCBBB);

  /// Gradient hijau untuk kartu poin & tombol utama (eco-gradient di mockup).
  static const LinearGradient ecoGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, primaryContainer],
  );
}
