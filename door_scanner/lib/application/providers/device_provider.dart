import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/repositories/i_device_repository.dart';
import '../../domain/usecases/register_device.dart';
import '../../data/repositories/device_repository_impl.dart';
import '../../data/datasources/remote/device_remote_datasource.dart';
import '../../infrastructure/network/api_client.dart';
import 'auth_provider.dart';
import '../notifiers/device_notifier.dart';

final deviceRemoteDataSourceProvider = Provider<DeviceRemoteDataSource>((ref) {
  return DeviceRemoteDataSource(ApiClient.instance.dio);
});

final deviceRepositoryProvider = Provider<IDeviceRepository>((ref) {
  return DeviceRepositoryImpl(
    remoteDataSource: ref.read(deviceRemoteDataSourceProvider),
    secureStorage: ref.read(secureStorageProvider),
  );
});

final registerDeviceUseCaseProvider = Provider<RegisterDeviceUseCase>((ref) {
  return RegisterDeviceUseCase(ref.read(deviceRepositoryProvider));
});

final deviceNotifierProvider = AsyncNotifierProvider<DeviceNotifier, DeviceState>(
  DeviceNotifier.new,
);
