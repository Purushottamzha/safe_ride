import 'package:flutter/material.dart';

class PermissionDialog extends StatelessWidget {
  final String title;
  final String message;
  final VoidCallback onGrant;
  final VoidCallback? onDeny;

  const PermissionDialog({
    super.key,
    required this.title,
    required this.message,
    required this.onGrant,
    this.onDeny,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: onDeny ?? () => Navigator.of(context).pop(),
          child: const Text('Deny'),
        ),
        ElevatedButton(
          onPressed: () {
            onGrant();
            Navigator.of(context).pop();
          },
          child: const Text('Grant'),
        ),
      ],
    );
  }
}
