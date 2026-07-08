import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/repositories/i_auth_repository.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../data/datasources/remote/auth_remote_datasource.dart';
import '../../infrastructure/network/api_client.dart';
import '../../infrastructure/storage/secure_storage.dart';
import '../notifiers/auth_notifier.dart';

final secureStorageProvider = Provider<SecureStorage>((ref) => SecureStorage());

final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  return AuthRemoteDataSource(ApiClient.instance.dio);
});

final authRepositoryProvider = Provider<IAuthRepository>((ref) {
  return AuthRepositoryImpl(
    remoteDataSource: ref.read(authRemoteDataSourceProvider),
    secureStorage: ref.read(secureStorageProvider),
  );
});

final authNotifierProvider = AsyncNotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);
