import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'infrastructure/network/api_client.dart';
import 'infrastructure/storage/secure_storage.dart';
import 'application/services/lifecycle_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  ApiClient.initialize(secureStorage: SecureStorage());
  await LifecycleService.instance.initialize();
  await LifecycleService.instance.startMqtt();
  runApp(
    const ProviderScope(
      child: SafeRideApp(),
    ),
  );
}
