import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../infrastructure/mqtt/mqtt_offline_queue.dart';

final offlineQueueProvider = Provider<MqttOfflineQueue>((ref) {
  return MqttOfflineQueue.instance;
});

final offlineQueueLengthProvider = FutureProvider<int>((ref) async {
  return MqttOfflineQueue.instance.length;
});
