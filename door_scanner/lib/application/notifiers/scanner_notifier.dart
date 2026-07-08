import 'package:flutter_riverpod/flutter_riverpod.dart';

class ScannerNotifier extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}
}

final scannerNotifierProvider = AsyncNotifierProvider<ScannerNotifier, void>(
  ScannerNotifier.new,
);
