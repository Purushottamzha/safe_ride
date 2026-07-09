import 'package:uuid/uuid.dart';
import '../../core/utils/debounce_helper.dart';
import '../../domain/repositories/i_scan_repository.dart';
import '../../infrastructure/platform/camera_wrapper.dart';

enum ScanResult { success, duplicate, invalid }

class ScannerService {
  ScannerService._();

  static final ScannerService instance = ScannerService._();

  final _uuid = const Uuid();

  ScanResult? _lastResult;
  DateTime? _lastScanTime;
  bool _isProcessing = false;

  ScanResult? get lastResult => _lastResult;
  DateTime? get lastScanTime => _lastScanTime;
  bool get isProcessing => _isProcessing;

  Future<ScanResult> processScan(String qrData, IScanRepository repository) async {
    if (_isProcessing) return ScanResult.invalid;
    if (qrData.isEmpty) {
      _lastResult = ScanResult.invalid;
      return _lastResult!;
    }

    _isProcessing = true;

    try {
      if (DebounceHelper.isDuplicate(qrData)) {
        _lastResult = ScanResult.duplicate;
        _lastScanTime = DateTime.now();
        return _lastResult!;
      }

      final eventId = _uuid.v4();
      final scanEvent = {
        'eventId': eventId,
        'qrData': qrData,
        'scannedAt': DateTime.now().toIso8601String(),
      };

      await repository.insertScan(scanEvent);

      _lastResult = ScanResult.success;
      _lastScanTime = DateTime.now();
    } catch (_) {
      _lastResult = ScanResult.invalid;
    } finally {
      _isProcessing = false;
    }

    return _lastResult!;
  }

  void resetLastResult() {
    _lastResult = null;
    _lastScanTime = null;
  }

  void stopScanning() {
    _isProcessing = false;
    CameraWrapper.instance.stop();
    DebounceHelper.clean();
  }
}
