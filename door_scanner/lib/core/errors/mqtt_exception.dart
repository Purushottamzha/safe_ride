import 'app_exception.dart';

class MqttException extends AppException {
  final String? topic;
  const MqttException(super.message, {this.topic, super.code});
}
