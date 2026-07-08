import 'package:flutter/material.dart';

class AppScaffold extends StatelessWidget {
  final Widget child;
  final String title;

  const AppScaffold({
    super.key,
    required this.child,
    this.title = 'SafeRide',
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: child,
    );
  }
}
