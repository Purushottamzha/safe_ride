import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/scanner_service.dart';
import '../../domain/repositories/i_scan_repository.dart';
import '../../data/repositories/scan_repository_impl.dart';

class ScannerState {
  final bool isScanning;
  final bool isFlashOn;
  final int queuedCount;
  final ScanResult? lastResult;
  final DateTime? lastScanTime;
  final String? error;

  const ScannerState({
    this.isScanning = false,
    this.isFlashOn = false,
    this.queuedCount = 0,
    this.lastResult,
    this.lastScanTime,
    this.error,
  });

  ScannerState copyWith({
    bool? isScanning,
    bool? isFlashOn,
    int? queuedCount,
    ScanResult? lastResult,
    DateTime? lastScanTime,
    String? error,
  }) {
    return ScannerState(
      isScanning: isScanning ?? this.isScanning,
      isFlashOn: isFlashOn ?? this.isFlashOn,
      queuedCount: queuedCount ?? this.queuedCount,
      lastResult: lastResult ?? this.lastResult,
      lastScanTime: lastScanTime ?? this.lastScanTime,
      error: error ?? this.error,
    );
  }
}

class ScannerNotifier extends StateNotifier<ScannerState> {
  ScannerNotifier(this._repository) : super(const ScannerState());

  final IScanRepository _repository;
  final _service = ScannerService.instance;

  Future<void> startScanning() async {
    if (state.isScanning) return;
    state = state.copyWith(isScanning: true, error: null);
    await refreshQueueCount();
  }

  void stopScanning() {
    if (!state.isScanning) return;
    _service.stopScanning();
    state = state.copyWith(isScanning: false);
  }

  void toggleFlash() {
    state = state.copyWith(isFlashOn: !state.isFlashOn);
  }

  Future<ScanResult> handleDetection(String qrData) async {
    if (!state.isScanning) return ScanResult.invalid;

    final result = await _service.processScan(qrData, _repository);

    state = state.copyWith(
      lastResult: result,
      lastScanTime: _service.lastScanTime,
    );

    if (result == ScanResult.success) {
      final count = await _repository.countUnsynced();
      state = state.copyWith(queuedCount: count);
    }

    return result;
  }

  Future<void> refreshQueueCount() async {
    final count = await _repository.countUnsynced();
    state = state.copyWith(queuedCount: count);
  }

  void clearResult() {
    _service.resetLastResult();
    state = state.copyWith(lastResult: null, lastScanTime: null);
  }
}

final scannerNotifierProvider =
    StateNotifierProvider<ScannerNotifier, ScannerState>((ref) {
  final repository = ScanRepositoryImpl();
  return ScannerNotifier(repository);
});
