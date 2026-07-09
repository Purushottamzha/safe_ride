import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:door_scanner/domain/repositories/i_scan_repository.dart';
import 'package:door_scanner/application/services/scanner_service.dart';

class MockScanRepository extends Mock implements IScanRepository {}

void main() {
  late MockScanRepository mockRepo;
  late ScannerService service;

  setUp(() {
    mockRepo = MockScanRepository();
    service = ScannerService.instance;
    service.resetLastResult();
    when(() => mockRepo.insertScan(any())).thenAnswer((_) async {});
    when(() => mockRepo.countUnsynced()).thenAnswer((_) async => 0);
  });

  tearDown(() {
    service.resetLastResult();
  });

  group('processing lock', () {
    test('should process single scan when not already processing', () async {
      final result = await service.processScan('QR:12345', mockRepo);
      expect(result, ScanResult.success);
    });

    test('should reject scan while already processing', () async {
      when(() => mockRepo.insertScan(any())).thenAnswer((_) async {
        await Future.delayed(const Duration(milliseconds: 100));
      });

      final future1 = service.processScan('QR:111', mockRepo);
      final future2 = service.processScan('QR:222', mockRepo);

      final result1 = await future1;
      final result2 = await future2;

      expect(result1, ScanResult.success);
      expect(result2, ScanResult.invalid);
    });

    test('should process again after previous scan completes', () async {
      final result1 = await service.processScan('QR:A', mockRepo);
      expect(result1, ScanResult.success);

      final result2 = await service.processScan('QR:B', mockRepo);
      expect(result2, ScanResult.success);
    });
  });

  group('duplicate detection', () {
    test('should return duplicate for same qr data within ttl', () async {
      final result1 = await service.processScan('QR:DUP', mockRepo);
      expect(result1, ScanResult.success);

      final result2 = await service.processScan('QR:DUP', mockRepo);
      expect(result2, ScanResult.duplicate);
    });

    test('should accept different qr data', () async {
      await service.processScan('QR:ONE', mockRepo);
      final result = await service.processScan('QR:TWO', mockRepo);
      expect(result, ScanResult.success);
    });

    test('sequential same qr data should return duplicate', () async {
      await service.processScan('QR:SEQ', mockRepo);
      await Future.delayed(const Duration(milliseconds: 5));
      final result = await service.processScan('QR:SEQ', mockRepo);
      expect(result, ScanResult.duplicate);
    });

    test('rapid same qr data should be rejected by processing lock', () async {
      when(() => mockRepo.insertScan(any())).thenAnswer((_) async {
        await Future.delayed(const Duration(milliseconds: 20));
      });
      final futures = List.generate(5, (_) => service.processScan('QR:RAPID', mockRepo));
      final results = await Future.wait(futures);
      expect(results.where((r) => r == ScanResult.success).length, 1);
      expect(results.where((r) => r == ScanResult.invalid).length, 4);
    });
  });

  group('input validation', () {
    test('should return invalid for empty qr data', () async {
      final result = await service.processScan('', mockRepo);
      expect(result, ScanResult.invalid);
    });

    test('should return invalid for null-like empty data', () async {
      final result = await service.processScan('', mockRepo);
      expect(result, ScanResult.invalid);
    });
  });

  group('state management', () {
    test('should update lastResult after successful scan', () async {
      await service.processScan('QR:STATE', mockRepo);
      expect(service.lastResult, ScanResult.success);
      expect(service.lastScanTime, isNotNull);
    });

    test('should clear lastResult on reset', () async {
      await service.processScan('QR:RESET', mockRepo);
      expect(service.lastResult, ScanResult.success);
      service.resetLastResult();
      expect(service.lastResult, isNull);
      expect(service.lastScanTime, isNull);
    });
  });
}
