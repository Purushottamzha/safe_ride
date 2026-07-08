import 'package:flutter_riverpod/flutter_riverpod.dart';

class MqttNotifier extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}
}

final mqttNotifierProvider = AsyncNotifierProvider<MqttNotifier, void>(
  MqttNotifier.new,
);
