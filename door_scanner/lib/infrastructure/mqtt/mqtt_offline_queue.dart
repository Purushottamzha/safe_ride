import 'package:uuid/uuid.dart';
import '../database/app_database.dart';
import '../database/daos/mqtt_queue_dao.dart';

class QueuedMessage {
  final String id;
  final String topic;
  final String payload;
  final String eventId;
  final DateTime createdAt;
  final int retryCount;
  final String? lastError;
  final String status;

  const QueuedMessage({
    required this.id,
    required this.topic,
    required this.payload,
    required this.eventId,
    required this.createdAt,
    this.retryCount = 0,
    this.lastError,
    this.status = 'created',
  });

  QueuedMessage copyWith({
    String? id,
    String? topic,
    String? payload,
    String? eventId,
    DateTime? createdAt,
    int? retryCount,
    String? lastError,
    String? status,
  }) {
    return QueuedMessage(
      id: id ?? this.id,
      topic: topic ?? this.topic,
      payload: payload ?? this.payload,
      eventId: eventId ?? this.eventId,
      createdAt: createdAt ?? this.createdAt,
      retryCount: retryCount ?? this.retryCount,
      lastError: lastError ?? this.lastError,
      status: status ?? this.status,
    );
  }

  static QueuedMessage create({
    required String topic,
    required String payload,
    required String eventId,
  }) {
    return QueuedMessage(
      id: const Uuid().v4(),
      topic: topic,
      payload: payload,
      eventId: eventId,
      createdAt: DateTime.now(),
      status: 'created',
    );
  }

  Map<String, dynamic> toDaoMap() => {
    'eventId': eventId,
    'topic': topic,
    'payload': payload,
    'qos': 1,
    'status': status,
    'retryCount': retryCount,
    'maxRetries': 5,
    'createdAt': createdAt,
    'lastError': lastError,
  };

  factory QueuedMessage.fromDaoMap(Map<String, dynamic> map) => QueuedMessage(
    id: const Uuid().v4(),
    topic: map['topic'] as String? ?? '',
    payload: map['payload'] as String? ?? '',
    eventId: map['event_id'] as String? ?? map['eventId'] as String,
    createdAt: map['created_at'] != null
        ? DateTime.parse(map['created_at'] as String)
        : map['createdAt'] is DateTime
            ? map['createdAt'] as DateTime
            : DateTime.now(),
    retryCount: map['retry_count'] as int? ?? map['retryCount'] as int? ?? 0,
    lastError: map['last_error'] as String? ?? map['lastError'] as String?,
    status: map['status'] as String? ?? 'queued',
  );
}

class MqttOfflineQueue {
  static final MqttOfflineQueue instance = MqttOfflineQueue._();
  MqttOfflineQueue._() : _dao = null;

  final MqttQueueDao? _dao;

  MqttOfflineQueue.withDao(this._dao);

  MqttQueueDao get _mqttDao => _dao ?? AppDatabase.instance.mqttQueueDao;

  Future<void> enqueue(String topic, String payload, String eventId, {String status = 'queued'}) async {
    final message = QueuedMessage.create(topic: topic, payload: payload, eventId: eventId)
        .copyWith(status: status);
    await _mqttDao.insertOrReplace(message.toDaoMap());
  }

  Future<List<QueuedMessage>> flushBatch({int limit = 50}) async {
    final rows = await _mqttDao.getByStatus('queued');
    final batch = <QueuedMessage>[];
    for (final row in rows.take(limit)) {
      await _mqttDao.updateStatus(row['event_id'] as String, 'publishing');
      batch.add(QueuedMessage.fromDaoMap(row));
    }
    return batch;
  }

  Future<void> removeAcknowledged(List<String> eventIds) async {
    for (final eventId in eventIds) {
      await _mqttDao.deleteByEventId(eventId);
    }
  }

  Future<void> retryFailed(QueuedMessage message) async {
    await _mqttDao.updateStatus(message.eventId, 'queued');
    await _mqttDao.incrementRetry(message.eventId, error: message.lastError);
  }

  Future<int> get length async {
    return await _mqttDao.countByStatus('queued');
  }

  Future<void> clear() async {
    await _mqttDao.clear();
  }
}
