import 'package:app_settings/app_settings.dart';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../../presentation/theme/spacing.dart';
import '../../../../infrastructure/platform/camera_wrapper.dart';

enum CameraErrorState { none, initializing, permissionDenied, unsupported, unavailable }

class CameraErrorHandler extends StatefulWidget {
  final Widget child;

  const CameraErrorHandler({super.key, required this.child});

  @override
  State<CameraErrorHandler> createState() => _CameraErrorHandlerState();
}

class _CameraErrorHandlerState extends State<CameraErrorHandler> {
  CameraErrorState _errorState = CameraErrorState.none;
  int _retryCount = 0;
  static const int maxRetries = 3;

  @override
  void initState() {
    super.initState();
    CameraWrapper.instance.controller.addListener(_onCameraStateChanged);
    _evaluateState();
  }

  @override
  void dispose() {
    CameraWrapper.instance.controller.removeListener(_onCameraStateChanged);
    super.dispose();
  }

  void _onCameraStateChanged() {
    _evaluateState();
  }

  void _evaluateState() {
    final state = CameraWrapper.instance.controller.value;
    setState(() {
      if (!state.isInitialized && state.error == null) {
        _errorState = CameraErrorState.initializing;
      } else if (state.error?.errorCode == MobileScannerErrorCode.permissionDenied) {
        _errorState = CameraErrorState.permissionDenied;
      } else if (state.error?.errorCode == MobileScannerErrorCode.unsupported) {
        _errorState = CameraErrorState.unsupported;
      } else if (state.error != null) {
        _errorState = CameraErrorState.unavailable;
      } else if (state.isInitialized) {
        _errorState = CameraErrorState.none;
      }
    });
  }

  Future<void> _retry() async {
    if (_retryCount >= maxRetries) return;
    _retryCount++;
    setState(() => _errorState = CameraErrorState.initializing);
    try {
      await CameraWrapper.instance.restart();
    } catch (_) {
      // state will update via listener
    }
  }

  Future<void> _openSettings() async {
    await AppSettings.openAppSettings(type: AppSettingsType.settings);
  }

  @override
  Widget build(BuildContext context) {
    if (_errorState == CameraErrorState.none) return widget.child;

    return Stack(
      children: [
        widget.child,
        Container(
          color: Colors.black87,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildIcon(),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    _title,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    _message,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white70),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  ..._buildActions(),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildIcon() {
    final IconData icon;
    final Color color;
    switch (_errorState) {
      case CameraErrorState.initializing:
        icon = Icons.camera_alt;
        color = Colors.white;
        return SizedBox(
          width: 64, height: 64,
          child: CircularProgressIndicator(color: color, strokeWidth: 3),
        );
      case CameraErrorState.permissionDenied:
        icon = Icons.no_photography;
        color = Colors.orange;
        break;
      case CameraErrorState.unsupported:
        icon = Icons.phonelink_off;
        color = Colors.red;
        break;
      case CameraErrorState.unavailable:
        icon = Icons.error_outline;
        color = Colors.red;
        break;
      default:
        return const SizedBox.shrink();
    }
    return Icon(icon, size: 64, color: color);
  }

  String get _title {
    switch (_errorState) {
      case CameraErrorState.initializing:
        return 'Starting camera...';
      case CameraErrorState.permissionDenied:
        return 'Camera permission required';
      case CameraErrorState.unsupported:
        return 'Camera not available';
      case CameraErrorState.unavailable:
        return 'Camera error';
      default:
        return '';
    }
  }

  String get _message {
    switch (_errorState) {
      case CameraErrorState.initializing:
        return 'Please wait while the camera initializes.';
      case CameraErrorState.permissionDenied:
        return 'Camera access is required to scan QR codes. '
            'Please grant camera permission in your device settings.';
      case CameraErrorState.unsupported:
        return 'This device does not have a camera or scanning is not supported.';
      case CameraErrorState.unavailable:
        return 'The camera is unavailable or in use by another application. '
            'Close other camera apps and try again.';
      default:
        return '';
    }
  }

  List<Widget> _buildActions() {
    switch (_errorState) {
      case CameraErrorState.initializing:
        return [];
      case CameraErrorState.permissionDenied:
        return [
          FilledButton.icon(
            onPressed: _openSettings,
            icon: const Icon(Icons.settings),
            label: const Text('Open App Settings'),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextButton(
            onPressed: _retry,
            child: Text('Retry', style: TextStyle(color: Colors.white70)),
          ),
        ];
      case CameraErrorState.unsupported:
        return [
          FilledButton.icon(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.arrow_back),
            label: const Text('Go Back'),
          ),
        ];
      case CameraErrorState.unavailable:
        return [
          FilledButton.icon(
            onPressed: _retryCount < maxRetries ? _retry : null,
            icon: const Icon(Icons.refresh),
            label: Text(_retryCount < maxRetries ? 'Retry' : 'Max retries reached'),
          ),
        ];
      default:
        return [];
    }
  }
}
