import 'package:mobile_scanner/mobile_scanner.dart';

class CameraWrapper {
  CameraWrapper._();

  static final CameraWrapper instance = CameraWrapper._();

  MobileScannerController? _controller;
  bool _torchOn = false;

  MobileScannerController get controller =>
      _controller ??= MobileScannerController(
        detectionSpeed: DetectionSpeed.noDuplicates,
        facing: CameraFacing.back,
      );

  void ensureInitialized() {
    _controller ??= MobileScannerController(
      detectionSpeed: DetectionSpeed.noDuplicates,
      facing: CameraFacing.back,
    );
  }

  Future<void> start() async {
    ensureInitialized();
    await _controller?.start();
  }

  Future<void> stop() async {
    await _controller?.stop();
  }

  Future<void> toggleTorch() async {
    _torchOn = !_torchOn;
    await _controller?.toggleTorch();
  }

  bool get isTorchOn => _torchOn;

  bool get isRunning => controller.value.isRunning;
  bool get isInitialized => controller.value.isInitialized;
  MobileScannerException? get error => controller.value.error;

  Future<void> restart() async {
    await stop();
    await start();
  }

  Future<void> dispose() async {
    await _controller?.dispose();
    _controller = null;
  }
}
