import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../application/notifiers/gps_notifier.dart';
import '../../../application/notifiers/scanner_notifier.dart';
import '../../../infrastructure/platform/camera_wrapper.dart';
import 'widgets/camera_error_handler.dart';
import 'widgets/scanner_debug_panel.dart';
import 'widgets/scan_overlay.dart';

class ScanScreen extends ConsumerStatefulWidget {
  const ScanScreen({super.key});

  @override
  ConsumerState<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends ConsumerState<ScanScreen> with WidgetsBindingObserver {
  MobileScannerController? _cameraController;
  Timer? _resultClearTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    Future.microtask(() {
      CameraWrapper.instance.ensureInitialized();
      _cameraController = CameraWrapper.instance.controller;
      ref.read(scannerNotifierProvider.notifier).startScanning();
      setState(() {});
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _resultClearTimer?.cancel();
    ref.read(scannerNotifierProvider.notifier).stopScanning();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _cameraController?.start();
      ref.read(scannerNotifierProvider.notifier).startScanning();
    } else if (state == AppLifecycleState.paused) {
      _cameraController?.stop();
      ref.read(scannerNotifierProvider.notifier).stopScanning();
    }
  }

  void _onDetect(BarcodeCapture capture) {
    final barcode = capture.barcodes.firstOrNull;
    final rawValue = barcode?.rawValue;
    if (rawValue == null || rawValue.isEmpty) return;

    final notifier = ref.read(scannerNotifierProvider.notifier);
    final state = ref.read(scannerNotifierProvider);
    if (state.lastScanTime != null &&
        DateTime.now().difference(state.lastScanTime!).inMilliseconds < 2000) {
      return;
    }

    notifier.handleDetection(rawValue);
    HapticFeedback.mediumImpact();

    _resultClearTimer?.cancel();
    _resultClearTimer = Timer(const Duration(seconds: 2), () {
      if (mounted) notifier.clearResult();
    });
  }

  void _toggleFlash() {
    CameraWrapper.instance.toggleTorch();
    ref.read(scannerNotifierProvider.notifier).toggleFlash();
  }

  @override
  Widget build(BuildContext context) {
    final scannerState = ref.watch(scannerNotifierProvider);
    final gpsState = ref.watch(gpsNotifierProvider);

    return Scaffold(
      backgroundColor: Colors.black,
      body: _buildBody(scannerState, gpsState),
    );
  }

  Widget _buildBody(ScannerState scannerState, GpsState gpsState) {
    final cameraContent = Stack(
      children: [
        if (_cameraController != null)
          MobileScanner(
            controller: _cameraController!,
            onDetect: _onDetect,
          )
        else
          const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(color: Colors.white),
                SizedBox(height: 16),
                Text('Initializing camera...', style: TextStyle(color: Colors.white70)),
              ],
            ),
          ),
        _buildTopBar(scannerState),
        ScanOverlay(
          bottomBar: ScanStatusBar(
            isConnected: true,
            queuedCount: scannerState.queuedCount,
          ),
        ),
        ScanFeedback(result: scannerState.lastResult),
      ],
    );

    return ScannerDebugPanel(
      gpsState: gpsState,
      child: CameraErrorHandler(
        child: cameraContent,
      ),
    );
  }

  Widget _buildTopBar(ScannerState scannerState) {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () => context.go('/'),
              ),
              const Spacer(),
              IconButton(
                icon: Icon(
                  scannerState.isFlashOn ? Icons.flash_on : Icons.flash_off,
                  color: Colors.white,
                ),
                onPressed: _toggleFlash,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
