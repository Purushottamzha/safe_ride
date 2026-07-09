import 'dart:async';
import 'dart:math';
import 'package:geolocator/geolocator.dart';
import 'package:uuid/uuid.dart';
import 'logger_service.dart';

class BenchService {
  BenchService._();

  static final BenchService instance = BenchService._();

  final _uuid = const Uuid();
  final _rng = Random();
  Timer? _scanTimer;
  Timer? _gpsTimer;
  bool _isRunning = false;
  int _scanCount = 0;
  int _gpsCount = 0;

  bool get isRunning => _isRunning;
  int get scanCount => _scanCount;
  int get gpsCount => _gpsCount;

  static final _route = <List<double>>[
    [27.7172, 85.3240],
    [27.7180, 85.3250],
    [27.7190, 85.3260],
    [27.7200, 85.3255],
    [27.7210, 85.3248],
    [27.7220, 85.3242],
    [27.7230, 85.3235],
    [27.7240, 85.3228],
    [27.7250, 85.3220],
    [27.7260, 85.3215],
  ];

  void startScanBench({Duration interval = const Duration(seconds: 3), int? maxScans}) {
    _scanCount = 0;
    _scanTimer?.cancel();
    LoggerService.instance.info(LogCategory.bench, 'Scan bench started',
        metadata: {'intervalMs': interval.inMilliseconds, 'maxScans': maxScans});
    _scanTimer = Timer.periodic(interval, (timer) {
      if (maxScans != null && _scanCount >= maxScans) {
        timer.cancel();
        LoggerService.instance.info(LogCategory.bench, 'Scan bench finished',
            metadata: {'totalScans': _scanCount});
        return;
      }
      _generateScan();
    });
    _isRunning = true;
  }

  void _generateScan() {
    final studentId = 'BENCH-${_uuid.v4().substring(0, 8)}';
    LoggerService.instance.debug(LogCategory.bench, 'Bench scan generated',
        metadata: {'studentId': studentId, 'count': _scanCount});
    _scanCount++;
  }

  void startGpsBench({Duration interval = const Duration(seconds: 5)}) {
    _gpsCount = 0;
    _gpsTimer?.cancel();
    LoggerService.instance.info(LogCategory.bench, 'GPS bench started',
        metadata: {'intervalMs': interval.inMilliseconds});
    _gpsTimer = Timer.periodic(interval, (_) => _generateGpsFix());
    _isRunning = true;
  }

  void _generateGpsFix() {
    final point = _route[_gpsCount % _route.length];
    final lat = point[0] + (_rng.nextDouble() - 0.5) * 0.0002;
    final lng = point[1] + (_rng.nextDouble() - 0.5) * 0.0002;
    final speed = 2.0 + _rng.nextDouble() * 10.0;

    final position = Position(
      latitude: lat,
      longitude: lng,
      accuracy: 5.0 + _rng.nextDouble() * 15.0,
      altitude: 1300.0,
      altitudeAccuracy: 10.0,
      heading: 45.0 + _rng.nextDouble() * 90.0,
      headingAccuracy: 10.0,
      speed: speed,
      speedAccuracy: 1.0,
      timestamp: DateTime.now(),
    );

    _gpsCount++;
    LoggerService.instance.debug(LogCategory.bench, 'Bench GPS fix generated',
        metadata: {
          'lat': position.latitude,
          'lng': position.longitude,
          'speed': position.speed,
          'count': _gpsCount,
        });
  }

  void stop() {
    _scanTimer?.cancel();
    _gpsTimer?.cancel();
    _scanTimer = null;
    _gpsTimer = null;
    _isRunning = false;
    LoggerService.instance.info(LogCategory.bench, 'Bench mode stopped',
        metadata: {'totalScans': _scanCount, 'totalGps': _gpsCount});
  }

  void reset() {
    stop();
    _scanCount = 0;
    _gpsCount = 0;
  }
}
