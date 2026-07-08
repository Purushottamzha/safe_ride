import 'package:flutter/material.dart';

class AppScaffold extends StatelessWidget {
  final Widget body;
  final String? title;
  final List<Widget>? actions;

  const AppScaffold({
    super.key,
    required this.body,
    this.title,
    this.actions,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: title != null
          ? AppBar(
              title: Text(title!),
              actions: actions,
            )
          : null,
      body: body,
    );
  }
}
