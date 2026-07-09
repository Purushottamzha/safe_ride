import 'package:uuid/uuid.dart';
import 'logger_service.dart';

class TripService {
  TripService._();

  static final TripService instance = TripService._();

  final _uuid = const Uuid();

  String? _currentTripId;

  String? get currentTripId => _currentTripId;

  String startTrip() {
    _currentTripId = _uuid.v4();
    LoggerService.instance.tripId = _currentTripId;
    LoggerService.instance.info(
      LogCategory.device,
      'Trip started',
      metadata: {'tripId': _currentTripId},
    );
    return _currentTripId!;
  }

  void endTrip() {
    if (_currentTripId != null) {
      LoggerService.instance.info(
        LogCategory.device,
        'Trip ended',
        metadata: {'tripId': _currentTripId},
      );
    }
    _currentTripId = null;
    LoggerService.instance.tripId = null;
  }

  void setTripId(String tripId) {
    _currentTripId = tripId;
    LoggerService.instance.tripId = tripId;
  }
}
