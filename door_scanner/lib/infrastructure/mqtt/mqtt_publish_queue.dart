import '../database/app_database.dart';
import '../database/daos/mqtt_queue_dao.dart';
import 'mqtt_ack_tracker.dart';
import 'mqtt_offline_queue.dart';

enum PublishState { created, queued, publishing, waitingPuback, completed, failed, archived }

class PublishEntry {
  final String topic;
  final String payload;
  final String eventId;
  final PublishState state;
  final DateTime createdAt;
  final DateTime? publishedAt;
  final String? error;

  const PublishEntry({
    required this.topic,
    required this.payload,
    required this.eventId,
    this.state = PublishState.created,
    required this.createdAt,
    this.publishedAt,
    this.error,
  });

  PublishEntry copyWith({
    String? topic,
    String? payload,
    String? eventId,
    PublishState? state,
    DateTime? createdAt,
    DateTime? publishedAt,
    String? error,
  }) {
    return PublishEntry(
      topic: topic ?? this.topic,
      payload: payload ?? this.payload,
      eventId: eventId ?? this.eventId,
      state: state ?? this.state,
      createdAt: createdAt ?? this.createdAt,
      publishedAt: publishedAt ?? this.publishedAt,
      error: error ?? this.error,
    );
  }
}

class MqttPublishQueue {
  static final MqttPublishQueue instance = MqttPublishQueue._();
  MqttPublishQueue._();

  MqttPublishQueue.withDao(this._dao);

  MqttPublishQueue.test({
    MqttQueueDao? dao,
    MqttAckTracker? ackTracker,
    MqttOfflineQueue? offlineQueue,
  })  : _dao = dao,
        _ackTracker = ackTracker ?? MqttAckTracker.instance,
        _offlineQueue = offlineQueue ?? MqttOfflineQueue.instance;

  final _queue = <PublishEntry>[];

  late final MqttAckTracker _ackTracker;
  late final MqttOfflineQueue _offlineQueue;

  MqttQueueDao? _dao;
  MqttQueueDao get _mqttDao => _dao ??= AppDatabase.instance.mqttQueueDao;

  bool Function(String topic, String payload, String eventId)? publishFn;
  bool _isProcessing = false;

  List<PublishEntry> get pending => _queue.where((e) => e.state == PublishState.queued).toList();
  int get length => _queue.length;

  Future<bool> publish(String topic, String payload, String eventId) async {
    final existing = await _mqttDao.getByEventId(eventId);
    final retryCount = existing?['retry_count'] as int? ?? 0;
    final maxRetries = existing?['max_retries'] as int? ?? 5;

    final entry = PublishEntry(
      topic: topic,
      payload: payload,
      eventId: eventId,
      createdAt: DateTime.now(),
    );
    _queue.add(entry);

    await _mqttDao.insertOrReplace({
      'eventId': eventId,
      'topic': topic,
      'payload': payload,
      'qos': 1,
      'status': 'created',
      'retryCount': retryCount,
      'maxRetries': maxRetries,
      'createdAt': entry.createdAt,
    });

    _processQueue();
    return true;
  }

  Future<void> _processQueue() async {
    if (_isProcessing) return;
    _isProcessing = true;

    while (_queue.isNotEmpty) {
      final entry = _queue.removeAt(0);

      if (entry.state == PublishState.queued || entry.state == PublishState.created) {
        await _mqttDao.updateStatus(entry.eventId, 'publishing');

        try {
          if (publishFn != null && publishFn!(entry.topic, entry.payload, entry.eventId)) {
            await _mqttDao.updateStatus(entry.eventId, 'waiting_puback');

            final acked = await _ackTracker.track(
              eventId: entry.eventId,
              topic: entry.topic,
            );
            if (acked) {
              await _mqttDao.updateStatus(entry.eventId, 'completed');
              await _mqttDao.updateStatus(entry.eventId, 'archived');
              _ackTracker.onAck(entry.eventId);
            } else {
              final row = await _mqttDao.getByEventId(entry.eventId);
              final retryCount = row?['retry_count'] as int? ?? 0;
              final maxRetries = row?['max_retries'] as int? ?? 5;
              if (retryCount < maxRetries) {
                await _mqttDao.updateStatus(entry.eventId, 'queued', error: 'No ACK received');
                await _mqttDao.incrementRetry(entry.eventId, error: 'No ACK received');
              } else {
                await _mqttDao.updateStatus(entry.eventId, 'failed', error: 'Max retries exceeded');
              }
            }
          } else {
            await _offlineQueue.enqueue(entry.topic, entry.payload, entry.eventId);
            await _mqttDao.updateStatus(entry.eventId, 'queued');
          }
        } catch (e) {
          await _offlineQueue.enqueue(entry.topic, entry.payload, entry.eventId);
          await _mqttDao.updateStatus(entry.eventId, 'queued');
        }
      } else {
        break;
      }
    }

    _isProcessing = false;
  }

  void removeCompleted() {
    _queue.removeWhere((e) => e.state == PublishState.completed);
  }

  void clear() {
    _queue.clear();
  }
}
