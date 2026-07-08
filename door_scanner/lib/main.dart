import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'infrastructure/network/api_client.dart';
import 'infrastructure/storage/secure_storage.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  ApiClient.initialize(secureStorage: SecureStorage());
  runApp(
    const ProviderScope(
      child: SafeRideApp(),
    ),
  );
}
