abstract class IStudentRepository {
  Future<Object> getStudentById(String studentId);
  Future<List<Object>> getStudentsByTrip(String tripId);
}
