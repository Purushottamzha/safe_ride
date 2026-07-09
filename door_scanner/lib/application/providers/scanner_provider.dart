export '../notifiers/scanner_notifier.dart' show scannerNotifierProvider, ScannerState, ScannerNotifier;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/repositories/scan_repository_impl.dart';
import '../../domain/repositories/i_scan_repository.dart';
import '../services/scanner_service.dart';

final scanRepositoryProvider = Provider<IScanRepository>((ref) {
  return ScanRepositoryImpl();
});

final scannerServiceProvider = Provider<ScannerService>((ref) {
  return ScannerService.instance;
});
