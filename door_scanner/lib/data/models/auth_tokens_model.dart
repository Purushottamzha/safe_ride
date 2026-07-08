
import '../../domain/entities/auth_tokens.dart';
class AuthTokensModel {
  final String accessToken; final String refreshToken; final DateTime? expiresAt;
  const AuthTokensModel({required this.accessToken, required this.refreshToken, this.expiresAt});
  factory AuthTokensModel.fromJson(Map<String, dynamic> j) => AuthTokensModel(
    accessToken: j['accessToken'] as String, refreshToken: j['refreshToken'] as String,
    expiresAt: j['expiresAt'] != null ? DateTime.parse(j['expiresAt'] as String) : null);
  Map<String, dynamic> toJson() => {'accessToken': accessToken, 'refreshToken': refreshToken, if (expiresAt != null) 'expiresAt': expiresAt!.toIso8601String()};
  AuthTokens toEntity() => AuthTokens(accessToken: accessToken, refreshToken: refreshToken, expiresAt: expiresAt ?? DateTime.now().add(const Duration(hours: 1)));
  factory AuthTokensModel.fromEntity(AuthTokens e) => AuthTokensModel(accessToken: e.accessToken, refreshToken: e.refreshToken, expiresAt: e.expiresAt);
}
