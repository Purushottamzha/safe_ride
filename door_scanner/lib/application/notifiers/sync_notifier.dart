import 'package:flutter_riverpod/flutter_riverpod.dart';

class SyncNotifier extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}
}

final syncNotifierProvider = AsyncNotifierProvider<SyncNotifier, void>(
  SyncNotifier.new,
);
