class StudentModel {
  final String studentId;
  final String name;
  const StudentModel({required this.studentId, required this.name});
  factory StudentModel.fromJson(Map<String, dynamic> json) => StudentModel(studentId: json['studentId'] as String, name: json['name'] as String);
  Map<String, dynamic> toJson() => <String, dynamic>{'studentId': studentId, 'name': name};
}
