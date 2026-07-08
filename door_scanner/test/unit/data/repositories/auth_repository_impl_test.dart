import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:door_scanner/domain/entities/auth_tokens.dart';
import 'package:door_scanner/domain/entities/login_credentials.dart';
import 'package:door_scanner/infrastructure/storage/secure_storage.dart';
import 'package:door_scanner/data/datasources/remote/auth_remote_datasource.dart';
import 'package:door_scanner/data/models/auth_tokens_model.dart';
import 'package:door_scanner/data/repositories/auth_repository_impl.dart';

class MockAuthRemoteDataSource extends Mock implements AuthRemoteDataSource {}
class MockSecureStorage extends Mock implements SecureStorage {}

void main() {
  setUpAll(() {
    registerFallbackValue(AuthTokens(accessToken: '', refreshToken: '', expiresAt: DateTime.now()));
    registerFallbackValue(const AuthTokensModel(accessToken: '', refreshToken: ''));
    registerFallbackValue(const LoginCredentials(email: '', password: ''));
  });
  late MockAuthRemoteDataSource mockDataSource;
  late MockSecureStorage mockStorage;
  late AuthRepositoryImpl repository;
  late AuthTokens testTokens;

  setUp(() {
    mockDataSource = MockAuthRemoteDataSource();
    mockStorage = MockSecureStorage();
    repository = AuthRepositoryImpl(remoteDataSource: mockDataSource, secureStorage: mockStorage);
    testTokens = AuthTokens(accessToken: 'test_access', refreshToken: 'test_refresh', expiresAt: DateTime.now().add(const Duration(hours: 1)));
  });

  group('login', () {
    test('should call datasource and save tokens', () async {
      final credentials = const LoginCredentials(email: 'test@test.com', password: 'password123');
      final model = AuthTokensModel.fromEntity(testTokens);
      when(() => mockDataSource.login(any(), any())).thenAnswer((_) async => model);
      when(() => mockStorage.saveAuthTokens(any())).thenAnswer((_) async => {});
      final result = await repository.login(credentials);
      expect(result.accessToken, testTokens.accessToken);
      expect(result.refreshToken, testTokens.refreshToken);
      verify(() => mockDataSource.login(credentials.email, credentials.password)).called(1);
      verify(() => mockStorage.saveAuthTokens(any())).called(1);
    });
  });

  group('logout', () {
    test('should call logout and clear tokens', () async {
      when(() => mockDataSource.logout()).thenAnswer((_) async => {});
      when(() => mockStorage.clearAuthTokens()).thenAnswer((_) async => {});
      await repository.logout();
      verify(() => mockDataSource.logout()).called(1);
      verify(() => mockStorage.clearAuthTokens()).called(1);
    });
  });

  group('refreshToken', () {
    test('should refresh and save new tokens', () async {
      final newTokens = AuthTokens(accessToken: 'new_access', refreshToken: 'new_refresh', expiresAt: DateTime.now().add(const Duration(hours: 1)));
      final newModel = AuthTokensModel.fromEntity(newTokens);
      when(() => mockDataSource.refreshToken(any())).thenAnswer((_) async => newModel);
      when(() => mockStorage.saveAuthTokens(any())).thenAnswer((_) async => {});
      final result = await repository.refreshToken('old_refresh');
      expect(result.accessToken, 'new_access');
      verify(() => mockDataSource.refreshToken('old_refresh')).called(1);
    });
  });

  group('getStoredTokens', () {
    test('should return stored tokens', () async {
      when(() => mockStorage.getAuthTokens()).thenAnswer((_) async => testTokens);
      final result = await repository.getStoredTokens();
      expect(result, isNotNull);
      expect(result!.accessToken, testTokens.accessToken);
    });
  });
}
