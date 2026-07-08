import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../application/notifiers/device_notifier.dart';
import '../../../application/providers/device_provider.dart';


class SetupScreen extends ConsumerStatefulWidget {
  const SetupScreen({super.key});
  @override
  ConsumerState<SetupScreen> createState() => _SetupScreenState();
}

class _SetupScreenState extends ConsumerState<SetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _busIdController = TextEditingController();
  final _schoolIdController = TextEditingController();
  String _selectedType = 'ESP32_CAM';
  bool _isLoading = false;

  final _types = ['ESP32_CAM', 'ESP32_GPS'];

  @override
  void dispose() {
    _nameController.dispose();
    _busIdController.dispose();
    _schoolIdController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    await ref.read(deviceNotifierProvider.notifier).register(
      name: _nameController.text.trim(),
      type: _selectedType,
      busId: _busIdController.text.trim().isEmpty ? null : _busIdController.text.trim(),
      schoolId: _schoolIdController.text.trim().isEmpty ? null : _schoolIdController.text.trim(),
      firmwareVersion: '1.0.0',
    );
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    ref.listen<AsyncValue<DeviceState>>(deviceNotifierProvider, (prev, next) {
      next.whenOrNull(
        data: (state) {
          if (state.status == DeviceStatus.registered) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Device registered successfully!')),
            );
            context.go('/scan');
          } else if (state.status == DeviceStatus.error && state.error != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Error: ${state.error}'), backgroundColor: Colors.red),
            );
          }
        },
      );
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Register Device')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(Icons.qr_code_scanner, size: 80, color: theme.colorScheme.primary),
              const SizedBox(height: 16),
              Text(
                'Door Scanner Setup',
                style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Register this device with your school bus system',
                style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Device Name',
                  hintText: 'e.g. Gate-1 Scanner',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.devices),
                ),
                validator: (v) => v == null || v.trim().isEmpty ? 'Device name is required' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedType,
                decoration: const InputDecoration(
                  labelText: 'Device Type',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.category),
                ),
                items: _types.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                onChanged: (v) => setState(() => _selectedType = v ?? 'ESP32_CAM'),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _busIdController,
                decoration: const InputDecoration(
                  labelText: 'Bus ID (optional)',
                  hintText: 'UUID of assigned bus',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.directions_bus),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _schoolIdController,
                decoration: const InputDecoration(
                  labelText: 'School ID (optional)',
                  hintText: 'UUID of school',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.school),
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _register,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1B5E20),
                    foregroundColor: Colors.white,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Register Device', style: TextStyle(fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
