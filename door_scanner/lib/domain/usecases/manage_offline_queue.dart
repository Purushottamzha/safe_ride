import '../repositories/i_mqtt_repository.dart';
import '../../infrastructure/mqtt/mqtt_offline_queue.dart';
import '../../infrastructure/mqtt/mqtt_ack_tracker.dart';

class ManageOfflineQueueUseCase {
  final IMqttRepository _mqttRepository;
  final MqttOfflineQueue _offlineQueue;
  final MqttAckTracker _ackTracker;

  ManageOfflineQueueUseCase(
    this._mqttRepository, {
    MqttOfflineQueue? offlineQueue,
    MqttAckTracker? ackTracker,
  })  : _offlineQueue = offlineQueue ?? MqttOfflineQueue.instance,
        _ackTracker = ackTracker ?? MqttAckTracker.instance;

  Future<int> flushPending({int limit = 50}) async {
    final batch = await _offlineQueue.flushBatch(limit: limit);
    int published = 0;

    for (final message in batch) {
      try {
        final success = await _mqttRepository.publish(message.topic, message.payload);
        if (success) {
          _ackTracker.onAck(message.eventId);
          published++;
        } else {
          await _offlineQueue.retryFailed(message);
        }
      } catch (_) {
        await _offlineQueue.retryFailed(message);
      }
    }

    return published;
  }

  Future<void> enqueue(String topic, String payload, String eventId) async {
    await _offlineQueue.enqueue(topic, payload, eventId);
  }

  Future<int> get pendingCount async => _offlineQueue.length;
}
