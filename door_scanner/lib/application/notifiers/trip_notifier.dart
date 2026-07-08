import 'package:flutter_riverpod/flutter_riverpod.dart';

class TripNotifier extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}
}

final tripNotifierProvider = AsyncNotifierProvider<TripNotifier, void>(
  TripNotifier.new,
);
