import 'package:flutter/material.dart';
import 'colors.dart';
import 'typography.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorSchemeSeed: AppColors.primary,
        brightness: Brightness.light,
        textTheme: const TextTheme(
          displayLarge: AppTypography.displayLarge,
          headlineMedium: AppTypography.headlineMedium,
          titleLarge: AppTypography.titleLarge,
          titleMedium: AppTypography.titleMedium,
          bodyLarge: AppTypography.bodyLarge,
          bodyMedium: AppTypography.bodyMedium,
          bodySmall: AppTypography.bodySmall,
          labelLarge: AppTypography.labelLarge,
          labelSmall: AppTypography.labelSmall,
        ),
      );

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        colorSchemeSeed: AppColors.primary,
        brightness: Brightness.dark,
        textTheme: const TextTheme(
          displayLarge: AppTypography.displayLarge,
          headlineMedium: AppTypography.headlineMedium,
          titleLarge: AppTypography.titleLarge,
          titleMedium: AppTypography.titleMedium,
          bodyLarge: AppTypography.bodyLarge,
          bodyMedium: AppTypography.bodyMedium,
          bodySmall: AppTypography.bodySmall,
          labelLarge: AppTypography.labelLarge,
          labelSmall: AppTypography.labelSmall,
        ),
      );
}
