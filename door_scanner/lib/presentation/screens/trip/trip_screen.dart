import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class TripScreen extends ConsumerWidget {
  final String? tripId;

  const TripScreen({super.key, this.tripId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subtitle = tripId != null ? 'Trip ID: ' : 'No active trip';
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('Trip Screen - Placeholder'),
            const SizedBox(height: 8),
            Text(subtitle),
          ],
        ),
      ),
    );
  }
}
