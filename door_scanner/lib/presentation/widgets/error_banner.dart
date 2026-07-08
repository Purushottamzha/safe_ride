import 'package:flutter/material.dart';

class ErrorBanner extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const ErrorBanner({
    super.key,
    required this.message,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return MaterialBanner(
      content: Text(message),
      leading: const Icon(Icons.error_outline, color: Colors.red),
      actions: [
        if (onRetry != null)
          TextButton(
            onPressed: onRetry,
            child: const Text('Retry'),
          ),
        TextButton(
          onPressed: () => ScaffoldMessenger.of(context).hideCurrentMaterialBanner(),
          child: const Text('Dismiss'),
        ),
      ],
    );
  }
}
