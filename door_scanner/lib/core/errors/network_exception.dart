import 'app_exception.dart';

class NetworkException extends AppException {
  final int? statusCode;
  const NetworkException(super.message, {this.statusCode, super.code});
}
