import '../../domain/repositories/i_student_repository.dart';

class StudentRepositoryImpl implements IStudentRepository {
  @override
  Future<Object> getStudentById(String studentId) async => Object();

  @override
  Future<List<Object>> getStudentsByTrip(String tripId) async => [];
}
