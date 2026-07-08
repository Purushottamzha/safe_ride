import 'package:flutter_riverpod/flutter_riverpod.dart';

class GpsNotifier extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}
}

final gpsNotifierProvider = AsyncNotifierProvider<GpsNotifier, void>(
  GpsNotifier.new,
);
