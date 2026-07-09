import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../application/notifiers/scanner_notifier.dart';

final isScanningProvider = Provider<bool>((ref) {
  return ref.watch(scannerNotifierProvider).isScanning;
});

final canScanProvider = Provider<bool>((ref) {
  final state = ref.watch(scannerNotifierProvider);
  return state.isScanning && state.error == null;
});
