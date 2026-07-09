import 'package:flutter/material.dart';
import '../../../../application/services/scanner_service.dart';
import '../../../../presentation/theme/colors.dart';
import '../../../../presentation/theme/spacing.dart';

class ScanOverlay extends StatelessWidget {
  final Widget? bottomBar;
  final Widget? topBar;

  const ScanOverlay({super.key, this.bottomBar, this.topBar});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(color: Colors.black.withValues(alpha: 0.5)),
        if (topBar != null) Positioned(top: 0, left: 0, right: 0, child: topBar!),
        Center(
          child: Container(
            width: 260,
            height: 260,
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.secondary, width: 3),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Padding(
              padding: const EdgeInsets.all(8),
              child: CustomPaint(
                painter: _CornerPainter(),
                child: const SizedBox.expand(),
              ),
            ),
          ),
        ),
        if (bottomBar != null) Positioned(bottom: 0, left: 0, right: 0, child: bottomBar!),
      ],
    );
  }
}

class _CornerPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.secondary
      ..strokeWidth = 4
      ..style = PaintingStyle.stroke;
    const length = 24.0;
    canvas.drawLine(const Offset(0, 0), const Offset(length, 0), paint);
    canvas.drawLine(const Offset(0, 0), const Offset(0, length), paint);
    canvas.drawLine(Offset(size.width, 0), Offset(size.width - length, 0), paint);
    canvas.drawLine(Offset(size.width, 0), Offset(size.width, length), paint);
    canvas.drawLine(Offset(0, size.height), Offset(length, size.height), paint);
    canvas.drawLine(Offset(0, size.height), Offset(0, size.height - length), paint);
    canvas.drawLine(Offset(size.width, size.height), Offset(size.width - length, size.height), paint);
    canvas.drawLine(Offset(size.width, size.height), Offset(size.width, size.height - length), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class ScanStatusBar extends StatelessWidget {
  final bool isConnected;
  final int queuedCount;
  final int? batteryLevel;

  const ScanStatusBar({
    super.key,
    required this.isConnected,
    required this.queuedCount,
    this.batteryLevel,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.6),
      ),
      child: Row(
        children: [
          Icon(Icons.circle, size: 10, color: isConnected ? Colors.green : Colors.red),
          const SizedBox(width: 6),
          Text(isConnected ? 'Connected' : 'Offline', style: const TextStyle(color: Colors.white, fontSize: 12)),
          const Spacer(),
          if (queuedCount > 0) ...[
            const Icon(Icons.cloud_upload, size: 14, color: Colors.orange),
            const SizedBox(width: 4),
            Text('$queuedCount', style: const TextStyle(color: Colors.orange, fontSize: 12)),
            const SizedBox(width: 12),
          ],
          if (batteryLevel != null) ...[
            Icon(batteryLevel! > 20 ? Icons.battery_full : Icons.battery_alert, size: 14, color: batteryLevel! > 20 ? Colors.white : Colors.red),
            const SizedBox(width: 4),
            Text('$batteryLevel%', style: const TextStyle(color: Colors.white, fontSize: 12)),
          ],
        ],
      ),
    );
  }
}

class ScanFeedback extends StatelessWidget {
  final ScanResult? result;

  const ScanFeedback({super.key, required this.result});

  @override
  Widget build(BuildContext context) {
    if (result == null) return const SizedBox.shrink();

    return Center(
      child: AnimatedOpacity(
        opacity: result != null ? 1.0 : 0.0,
        duration: const Duration(milliseconds: 200),
        child: Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: result == ScanResult.success
                ? Colors.green.withValues(alpha: 0.8)
                : Colors.red.withValues(alpha: 0.8),
          ),
          child: Icon(
            result == ScanResult.success ? Icons.check : Icons.close,
            color: Colors.white,
            size: 48,
          ),
        ),
      ),
    );
  }
}
