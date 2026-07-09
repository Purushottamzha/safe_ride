import 'dart:async';
import 'dart:convert';
import 'package:geolocator/geolocator.dart';
import 'package:uuid/uuid.dart';
import '../../data/repositories/location_repository_impl.dart';
import '../../infrastructure/mqtt/mqtt_publish_queue.dart';
import '../../infrastructure/storage/secure_storage.dart';
import 'adaptive_tracking_policy.dart';
import 'location_validator.dart';

enum PipelineEvent { accepted, filtered, error }

class LocationPipelineEvent {
  final PipelineEvent type;
  final String? reason;
  final Position? position;

  const LocationPipelineEvent({
    required this.type,
    this.reason,
    this.position,
  });
}

class LocationPipelineService {
  LocationPipelineService._();

  static final LocationPipelineService instance = LocationPipelineService._();

  final _uuid = const Uuid();
  final StreamController<LocationPipelineEvent> _events =
      StreamController<LocationPipelineEvent>.broadcast();

  Stream<LocationPipelineEvent> get events => _events.stream;

  Position? _lastPosition;
  DateTime? _lastTimestamp;
  TrackingPolicy _currentPolicy = TrackingPolicy.parked;

  TrackingPolicy get currentPolicy => _currentPolicy;

  Future<void> processPosition(Position position) async {
    final validation = LocationValidator.validate(
      position,
      lastPosition: _lastPosition,
      lastTimestamp: _lastTimestamp,
    );

    if (!validation.valid) {
      _events.add(LocationPipelineEvent(
        type: PipelineEvent.filtered,
        reason: validation.reason,
        position: position,
      ));
      _updatePolicy(position);
      return;
    }

    _lastPosition = position;
    _lastTimestamp = position.timestamp;

    try {
      final eventId = _uuid.v4();

      final locationEvent = {
        'eventId': eventId,
        'latitude': position.latitude,
        'longitude': position.longitude,
        'accuracy': position.accuracy,
        'speed': position.speed,
        'heading': position.heading,
        'timestamp': position.timestamp,
        'syncStatus': 'pending',
      };

      final repository = LocationRepositoryImpl();
      await repository.insertLocation(locationEvent);

      await _publishToMqtt(position, eventId);

      _events.add(LocationPipelineEvent(
        type: PipelineEvent.accepted,
        position: position,
      ));
    } catch (e) {
      _events.add(LocationPipelineEvent(
        type: PipelineEvent.error,
        reason: e.toString(),
        position: position,
      ));
    }

    _updatePolicy(position);
  }

  Future<void> _publishToMqtt(Position position, String eventId) async {
    try {
      final storage = SecureStorage();
      final config = await storage.getDeviceConfig();
      final schoolId = config?.schoolId ?? '';
      final busId = config?.busId ?? '';
      if (schoolId.isEmpty || busId.isEmpty) return;

      final topic = 'saferide/$schoolId/bus/$busId/location';
      final payload = jsonEncode({
        'eventId': eventId,
        'latitude': position.latitude,
        'longitude': position.longitude,
        'accuracy': position.accuracy,
        'speed': position.speed,
        'heading': position.heading,
        'timestamp': position.timestamp.toIso8601String(),
      });

      await MqttPublishQueue.instance.publish(topic, payload, eventId);
    } catch (_) {}
  }

  void _updatePolicy(Position position) {
    _currentPolicy = TrackingPolicy.forSpeed(position.speed);
  }

  void reset() {
    _lastPosition = null;
    _lastTimestamp = null;
    _currentPolicy = TrackingPolicy.parked;
  }
}
