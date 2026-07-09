import 'dart:async';
import 'dart:collection';

class PendingAck {
  final Completer<bool> completer;
  final Timer timer;
  final String eventId;
  final DateTime createdAt;
  final String topic;

  PendingAck({
    required this.completer,
    required this.timer,
    required this.eventId,
    required this.createdAt,
    required this.topic,
  });
}

class MqttAckTracker {
  static final MqttAckTracker instance = MqttAckTracker._();
  MqttAckTracker._();

  final _pending = <String, PendingAck>{};
  final _acked = HashSet<String>();

  int get pendingCount => _pending.length;

  Future<bool> track({
    required String eventId,
    required String topic,
    Duration timeout = const Duration(seconds: 30),
  }) {
    if (_acked.contains(eventId)) return Future.value(true);
    final existing = _pending[eventId];
    if (existing != null) return existing.completer.future;

    final completer = Completer<bool>();
    final timer = Timer(timeout, () {
      _pending.remove(eventId);
      if (!completer.isCompleted) completer.complete(false);
    });

    _pending[eventId] = PendingAck(
      completer: completer,
      timer: timer,
      eventId: eventId,
      createdAt: DateTime.now(),
      topic: topic,
    );

    return completer.future;
  }

  void onAck(String eventId) {
    _acked.add(eventId);
    final pending = _pending.remove(eventId);
    pending?.timer.cancel();
    if (pending != null && !pending.completer.isCompleted) {
      pending.completer.complete(true);
    }
  }

  void onTimeout(String eventId) {
    final pending = _pending.remove(eventId);
    pending?.timer.cancel();
    if (pending != null && !pending.completer.isCompleted) {
      pending.completer.complete(false);
    }
  }

  bool isAcked(String eventId) => _acked.contains(eventId);

  void clear() {
    for (final p in _pending.values) {
      p.timer.cancel();
      if (!p.completer.isCompleted) p.completer.complete(false);
    }
    _pending.clear();
    _acked.clear();
  }

  void dispose() {
    clear();
  }
}
