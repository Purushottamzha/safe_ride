// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $DeviceStateTableTable extends DeviceStateTable
    with TableInfo<$DeviceStateTableTable, DeviceStateTableData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $DeviceStateTableTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _keyMeta = const VerificationMeta('key');
  @override
  late final GeneratedColumn<String> key = GeneratedColumn<String>(
    'key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _valueMeta = const VerificationMeta('value');
  @override
  late final GeneratedColumn<String> value = GeneratedColumn<String>(
    'value',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [key, value, updatedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'device_state_table';
  @override
  VerificationContext validateIntegrity(
    Insertable<DeviceStateTableData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('key')) {
      context.handle(
        _keyMeta,
        key.isAcceptableOrUnknown(data['key']!, _keyMeta),
      );
    } else if (isInserting) {
      context.missing(_keyMeta);
    }
    if (data.containsKey('value')) {
      context.handle(
        _valueMeta,
        value.isAcceptableOrUnknown(data['value']!, _valueMeta),
      );
    } else if (isInserting) {
      context.missing(_valueMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {key};
  @override
  DeviceStateTableData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return DeviceStateTableData(
      key: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}key'],
      )!,
      value: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}value'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $DeviceStateTableTable createAlias(String alias) {
    return $DeviceStateTableTable(attachedDatabase, alias);
  }
}

class DeviceStateTableData extends DataClass
    implements Insertable<DeviceStateTableData> {
  final String key;
  final String value;
  final DateTime updatedAt;
  const DeviceStateTableData({
    required this.key,
    required this.value,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['key'] = Variable<String>(key);
    map['value'] = Variable<String>(value);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  DeviceStateTableCompanion toCompanion(bool nullToAbsent) {
    return DeviceStateTableCompanion(
      key: Value(key),
      value: Value(value),
      updatedAt: Value(updatedAt),
    );
  }

  factory DeviceStateTableData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return DeviceStateTableData(
      key: serializer.fromJson<String>(json['key']),
      value: serializer.fromJson<String>(json['value']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'key': serializer.toJson<String>(key),
      'value': serializer.toJson<String>(value),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  DeviceStateTableData copyWith({
    String? key,
    String? value,
    DateTime? updatedAt,
  }) => DeviceStateTableData(
    key: key ?? this.key,
    value: value ?? this.value,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  DeviceStateTableData copyWithCompanion(DeviceStateTableCompanion data) {
    return DeviceStateTableData(
      key: data.key.present ? data.key.value : this.key,
      value: data.value.present ? data.value.value : this.value,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('DeviceStateTableData(')
          ..write('key: $key, ')
          ..write('value: $value, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(key, value, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is DeviceStateTableData &&
          other.key == this.key &&
          other.value == this.value &&
          other.updatedAt == this.updatedAt);
}

class DeviceStateTableCompanion extends UpdateCompanion<DeviceStateTableData> {
  final Value<String> key;
  final Value<String> value;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const DeviceStateTableCompanion({
    this.key = const Value.absent(),
    this.value = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  DeviceStateTableCompanion.insert({
    required String key,
    required String value,
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : key = Value(key),
       value = Value(value);
  static Insertable<DeviceStateTableData> custom({
    Expression<String>? key,
    Expression<String>? value,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (key != null) 'key': key,
      if (value != null) 'value': value,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  DeviceStateTableCompanion copyWith({
    Value<String>? key,
    Value<String>? value,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return DeviceStateTableCompanion(
      key: key ?? this.key,
      value: value ?? this.value,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (key.present) {
      map['key'] = Variable<String>(key.value);
    }
    if (value.present) {
      map['value'] = Variable<String>(value.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('DeviceStateTableCompanion(')
          ..write('key: $key, ')
          ..write('value: $value, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $MqttQueueTableTable extends MqttQueueTable
    with TableInfo<$MqttQueueTableTable, MqttQueueEntry> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $MqttQueueTableTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _eventIdMeta = const VerificationMeta(
    'eventId',
  );
  @override
  late final GeneratedColumn<String> eventId = GeneratedColumn<String>(
    'event_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _topicMeta = const VerificationMeta('topic');
  @override
  late final GeneratedColumn<String> topic = GeneratedColumn<String>(
    'topic',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _payloadMeta = const VerificationMeta(
    'payload',
  );
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
    'payload',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _qosMeta = const VerificationMeta('qos');
  @override
  late final GeneratedColumn<int> qos = GeneratedColumn<int>(
    'qos',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(1),
  );
  static const VerificationMeta _retainMeta = const VerificationMeta('retain');
  @override
  late final GeneratedColumn<int> retain = GeneratedColumn<int>(
    'retain',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _retryCountMeta = const VerificationMeta(
    'retryCount',
  );
  @override
  late final GeneratedColumn<int> retryCount = GeneratedColumn<int>(
    'retry_count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _maxRetriesMeta = const VerificationMeta(
    'maxRetries',
  );
  @override
  late final GeneratedColumn<int> maxRetries = GeneratedColumn<int>(
    'max_retries',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(5),
  );
  static const VerificationMeta _lastAttemptMeta = const VerificationMeta(
    'lastAttempt',
  );
  @override
  late final GeneratedColumn<DateTime> lastAttempt = GeneratedColumn<DateTime>(
    'last_attempt',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _nextRetryMeta = const VerificationMeta(
    'nextRetry',
  );
  @override
  late final GeneratedColumn<DateTime> nextRetry = GeneratedColumn<DateTime>(
    'next_retry',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _lastErrorMeta = const VerificationMeta(
    'lastError',
  );
  @override
  late final GeneratedColumn<String> lastError = GeneratedColumn<String>(
    'last_error',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    eventId,
    topic,
    payload,
    qos,
    retain,
    status,
    retryCount,
    maxRetries,
    lastAttempt,
    nextRetry,
    lastError,
    createdAt,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'mqtt_queue_table';
  @override
  VerificationContext validateIntegrity(
    Insertable<MqttQueueEntry> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('event_id')) {
      context.handle(
        _eventIdMeta,
        eventId.isAcceptableOrUnknown(data['event_id']!, _eventIdMeta),
      );
    } else if (isInserting) {
      context.missing(_eventIdMeta);
    }
    if (data.containsKey('topic')) {
      context.handle(
        _topicMeta,
        topic.isAcceptableOrUnknown(data['topic']!, _topicMeta),
      );
    } else if (isInserting) {
      context.missing(_topicMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(
        _payloadMeta,
        payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta),
      );
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    if (data.containsKey('qos')) {
      context.handle(
        _qosMeta,
        qos.isAcceptableOrUnknown(data['qos']!, _qosMeta),
      );
    }
    if (data.containsKey('retain')) {
      context.handle(
        _retainMeta,
        retain.isAcceptableOrUnknown(data['retain']!, _retainMeta),
      );
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('retry_count')) {
      context.handle(
        _retryCountMeta,
        retryCount.isAcceptableOrUnknown(data['retry_count']!, _retryCountMeta),
      );
    }
    if (data.containsKey('max_retries')) {
      context.handle(
        _maxRetriesMeta,
        maxRetries.isAcceptableOrUnknown(data['max_retries']!, _maxRetriesMeta),
      );
    }
    if (data.containsKey('last_attempt')) {
      context.handle(
        _lastAttemptMeta,
        lastAttempt.isAcceptableOrUnknown(
          data['last_attempt']!,
          _lastAttemptMeta,
        ),
      );
    }
    if (data.containsKey('next_retry')) {
      context.handle(
        _nextRetryMeta,
        nextRetry.isAcceptableOrUnknown(data['next_retry']!, _nextRetryMeta),
      );
    }
    if (data.containsKey('last_error')) {
      context.handle(
        _lastErrorMeta,
        lastError.isAcceptableOrUnknown(data['last_error']!, _lastErrorMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {eventId};
  @override
  MqttQueueEntry map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return MqttQueueEntry(
      eventId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}event_id'],
      )!,
      topic: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}topic'],
      )!,
      payload: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}payload'],
      )!,
      qos: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}qos'],
      )!,
      retain: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}retain'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      retryCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}retry_count'],
      )!,
      maxRetries: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}max_retries'],
      )!,
      lastAttempt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_attempt'],
      ),
      nextRetry: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}next_retry'],
      ),
      lastError: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}last_error'],
      ),
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $MqttQueueTableTable createAlias(String alias) {
    return $MqttQueueTableTable(attachedDatabase, alias);
  }
}

class MqttQueueEntry extends DataClass implements Insertable<MqttQueueEntry> {
  final String eventId;
  final String topic;
  final String payload;
  final int qos;
  final int retain;
  final String status;
  final int retryCount;
  final int maxRetries;
  final DateTime? lastAttempt;
  final DateTime? nextRetry;
  final String? lastError;
  final DateTime createdAt;
  final DateTime updatedAt;
  const MqttQueueEntry({
    required this.eventId,
    required this.topic,
    required this.payload,
    required this.qos,
    required this.retain,
    required this.status,
    required this.retryCount,
    required this.maxRetries,
    this.lastAttempt,
    this.nextRetry,
    this.lastError,
    required this.createdAt,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['event_id'] = Variable<String>(eventId);
    map['topic'] = Variable<String>(topic);
    map['payload'] = Variable<String>(payload);
    map['qos'] = Variable<int>(qos);
    map['retain'] = Variable<int>(retain);
    map['status'] = Variable<String>(status);
    map['retry_count'] = Variable<int>(retryCount);
    map['max_retries'] = Variable<int>(maxRetries);
    if (!nullToAbsent || lastAttempt != null) {
      map['last_attempt'] = Variable<DateTime>(lastAttempt);
    }
    if (!nullToAbsent || nextRetry != null) {
      map['next_retry'] = Variable<DateTime>(nextRetry);
    }
    if (!nullToAbsent || lastError != null) {
      map['last_error'] = Variable<String>(lastError);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  MqttQueueTableCompanion toCompanion(bool nullToAbsent) {
    return MqttQueueTableCompanion(
      eventId: Value(eventId),
      topic: Value(topic),
      payload: Value(payload),
      qos: Value(qos),
      retain: Value(retain),
      status: Value(status),
      retryCount: Value(retryCount),
      maxRetries: Value(maxRetries),
      lastAttempt: lastAttempt == null && nullToAbsent
          ? const Value.absent()
          : Value(lastAttempt),
      nextRetry: nextRetry == null && nullToAbsent
          ? const Value.absent()
          : Value(nextRetry),
      lastError: lastError == null && nullToAbsent
          ? const Value.absent()
          : Value(lastError),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
    );
  }

  factory MqttQueueEntry.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return MqttQueueEntry(
      eventId: serializer.fromJson<String>(json['eventId']),
      topic: serializer.fromJson<String>(json['topic']),
      payload: serializer.fromJson<String>(json['payload']),
      qos: serializer.fromJson<int>(json['qos']),
      retain: serializer.fromJson<int>(json['retain']),
      status: serializer.fromJson<String>(json['status']),
      retryCount: serializer.fromJson<int>(json['retryCount']),
      maxRetries: serializer.fromJson<int>(json['maxRetries']),
      lastAttempt: serializer.fromJson<DateTime?>(json['lastAttempt']),
      nextRetry: serializer.fromJson<DateTime?>(json['nextRetry']),
      lastError: serializer.fromJson<String?>(json['lastError']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'eventId': serializer.toJson<String>(eventId),
      'topic': serializer.toJson<String>(topic),
      'payload': serializer.toJson<String>(payload),
      'qos': serializer.toJson<int>(qos),
      'retain': serializer.toJson<int>(retain),
      'status': serializer.toJson<String>(status),
      'retryCount': serializer.toJson<int>(retryCount),
      'maxRetries': serializer.toJson<int>(maxRetries),
      'lastAttempt': serializer.toJson<DateTime?>(lastAttempt),
      'nextRetry': serializer.toJson<DateTime?>(nextRetry),
      'lastError': serializer.toJson<String?>(lastError),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  MqttQueueEntry copyWith({
    String? eventId,
    String? topic,
    String? payload,
    int? qos,
    int? retain,
    String? status,
    int? retryCount,
    int? maxRetries,
    Value<DateTime?> lastAttempt = const Value.absent(),
    Value<DateTime?> nextRetry = const Value.absent(),
    Value<String?> lastError = const Value.absent(),
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => MqttQueueEntry(
    eventId: eventId ?? this.eventId,
    topic: topic ?? this.topic,
    payload: payload ?? this.payload,
    qos: qos ?? this.qos,
    retain: retain ?? this.retain,
    status: status ?? this.status,
    retryCount: retryCount ?? this.retryCount,
    maxRetries: maxRetries ?? this.maxRetries,
    lastAttempt: lastAttempt.present ? lastAttempt.value : this.lastAttempt,
    nextRetry: nextRetry.present ? nextRetry.value : this.nextRetry,
    lastError: lastError.present ? lastError.value : this.lastError,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  MqttQueueEntry copyWithCompanion(MqttQueueTableCompanion data) {
    return MqttQueueEntry(
      eventId: data.eventId.present ? data.eventId.value : this.eventId,
      topic: data.topic.present ? data.topic.value : this.topic,
      payload: data.payload.present ? data.payload.value : this.payload,
      qos: data.qos.present ? data.qos.value : this.qos,
      retain: data.retain.present ? data.retain.value : this.retain,
      status: data.status.present ? data.status.value : this.status,
      retryCount: data.retryCount.present
          ? data.retryCount.value
          : this.retryCount,
      maxRetries: data.maxRetries.present
          ? data.maxRetries.value
          : this.maxRetries,
      lastAttempt: data.lastAttempt.present
          ? data.lastAttempt.value
          : this.lastAttempt,
      nextRetry: data.nextRetry.present ? data.nextRetry.value : this.nextRetry,
      lastError: data.lastError.present ? data.lastError.value : this.lastError,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('MqttQueueEntry(')
          ..write('eventId: $eventId, ')
          ..write('topic: $topic, ')
          ..write('payload: $payload, ')
          ..write('qos: $qos, ')
          ..write('retain: $retain, ')
          ..write('status: $status, ')
          ..write('retryCount: $retryCount, ')
          ..write('maxRetries: $maxRetries, ')
          ..write('lastAttempt: $lastAttempt, ')
          ..write('nextRetry: $nextRetry, ')
          ..write('lastError: $lastError, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    eventId,
    topic,
    payload,
    qos,
    retain,
    status,
    retryCount,
    maxRetries,
    lastAttempt,
    nextRetry,
    lastError,
    createdAt,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is MqttQueueEntry &&
          other.eventId == this.eventId &&
          other.topic == this.topic &&
          other.payload == this.payload &&
          other.qos == this.qos &&
          other.retain == this.retain &&
          other.status == this.status &&
          other.retryCount == this.retryCount &&
          other.maxRetries == this.maxRetries &&
          other.lastAttempt == this.lastAttempt &&
          other.nextRetry == this.nextRetry &&
          other.lastError == this.lastError &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt);
}

class MqttQueueTableCompanion extends UpdateCompanion<MqttQueueEntry> {
  final Value<String> eventId;
  final Value<String> topic;
  final Value<String> payload;
  final Value<int> qos;
  final Value<int> retain;
  final Value<String> status;
  final Value<int> retryCount;
  final Value<int> maxRetries;
  final Value<DateTime?> lastAttempt;
  final Value<DateTime?> nextRetry;
  final Value<String?> lastError;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const MqttQueueTableCompanion({
    this.eventId = const Value.absent(),
    this.topic = const Value.absent(),
    this.payload = const Value.absent(),
    this.qos = const Value.absent(),
    this.retain = const Value.absent(),
    this.status = const Value.absent(),
    this.retryCount = const Value.absent(),
    this.maxRetries = const Value.absent(),
    this.lastAttempt = const Value.absent(),
    this.nextRetry = const Value.absent(),
    this.lastError = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  MqttQueueTableCompanion.insert({
    required String eventId,
    required String topic,
    required String payload,
    this.qos = const Value.absent(),
    this.retain = const Value.absent(),
    required String status,
    this.retryCount = const Value.absent(),
    this.maxRetries = const Value.absent(),
    this.lastAttempt = const Value.absent(),
    this.nextRetry = const Value.absent(),
    this.lastError = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : eventId = Value(eventId),
       topic = Value(topic),
       payload = Value(payload),
       status = Value(status);
  static Insertable<MqttQueueEntry> custom({
    Expression<String>? eventId,
    Expression<String>? topic,
    Expression<String>? payload,
    Expression<int>? qos,
    Expression<int>? retain,
    Expression<String>? status,
    Expression<int>? retryCount,
    Expression<int>? maxRetries,
    Expression<DateTime>? lastAttempt,
    Expression<DateTime>? nextRetry,
    Expression<String>? lastError,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (eventId != null) 'event_id': eventId,
      if (topic != null) 'topic': topic,
      if (payload != null) 'payload': payload,
      if (qos != null) 'qos': qos,
      if (retain != null) 'retain': retain,
      if (status != null) 'status': status,
      if (retryCount != null) 'retry_count': retryCount,
      if (maxRetries != null) 'max_retries': maxRetries,
      if (lastAttempt != null) 'last_attempt': lastAttempt,
      if (nextRetry != null) 'next_retry': nextRetry,
      if (lastError != null) 'last_error': lastError,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  MqttQueueTableCompanion copyWith({
    Value<String>? eventId,
    Value<String>? topic,
    Value<String>? payload,
    Value<int>? qos,
    Value<int>? retain,
    Value<String>? status,
    Value<int>? retryCount,
    Value<int>? maxRetries,
    Value<DateTime?>? lastAttempt,
    Value<DateTime?>? nextRetry,
    Value<String?>? lastError,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return MqttQueueTableCompanion(
      eventId: eventId ?? this.eventId,
      topic: topic ?? this.topic,
      payload: payload ?? this.payload,
      qos: qos ?? this.qos,
      retain: retain ?? this.retain,
      status: status ?? this.status,
      retryCount: retryCount ?? this.retryCount,
      maxRetries: maxRetries ?? this.maxRetries,
      lastAttempt: lastAttempt ?? this.lastAttempt,
      nextRetry: nextRetry ?? this.nextRetry,
      lastError: lastError ?? this.lastError,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (eventId.present) {
      map['event_id'] = Variable<String>(eventId.value);
    }
    if (topic.present) {
      map['topic'] = Variable<String>(topic.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (qos.present) {
      map['qos'] = Variable<int>(qos.value);
    }
    if (retain.present) {
      map['retain'] = Variable<int>(retain.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (retryCount.present) {
      map['retry_count'] = Variable<int>(retryCount.value);
    }
    if (maxRetries.present) {
      map['max_retries'] = Variable<int>(maxRetries.value);
    }
    if (lastAttempt.present) {
      map['last_attempt'] = Variable<DateTime>(lastAttempt.value);
    }
    if (nextRetry.present) {
      map['next_retry'] = Variable<DateTime>(nextRetry.value);
    }
    if (lastError.present) {
      map['last_error'] = Variable<String>(lastError.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('MqttQueueTableCompanion(')
          ..write('eventId: $eventId, ')
          ..write('topic: $topic, ')
          ..write('payload: $payload, ')
          ..write('qos: $qos, ')
          ..write('retain: $retain, ')
          ..write('status: $status, ')
          ..write('retryCount: $retryCount, ')
          ..write('maxRetries: $maxRetries, ')
          ..write('lastAttempt: $lastAttempt, ')
          ..write('nextRetry: $nextRetry, ')
          ..write('lastError: $lastError, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $ScanEventsTableTable extends ScanEventsTable
    with TableInfo<$ScanEventsTableTable, ScanEventsTableData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ScanEventsTableTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _eventIdMeta = const VerificationMeta(
    'eventId',
  );
  @override
  late final GeneratedColumn<String> eventId = GeneratedColumn<String>(
    'event_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _studentIdMeta = const VerificationMeta(
    'studentId',
  );
  @override
  late final GeneratedColumn<String> studentId = GeneratedColumn<String>(
    'student_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _tripIdMeta = const VerificationMeta('tripId');
  @override
  late final GeneratedColumn<String> tripId = GeneratedColumn<String>(
    'trip_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _scanTypeMeta = const VerificationMeta(
    'scanType',
  );
  @override
  late final GeneratedColumn<String> scanType = GeneratedColumn<String>(
    'scan_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _timestampMeta = const VerificationMeta(
    'timestamp',
  );
  @override
  late final GeneratedColumn<DateTime> timestamp = GeneratedColumn<DateTime>(
    'timestamp',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _syncStatusMeta = const VerificationMeta(
    'syncStatus',
  );
  @override
  late final GeneratedColumn<String> syncStatus = GeneratedColumn<String>(
    'sync_status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    eventId,
    studentId,
    tripId,
    scanType,
    timestamp,
    syncStatus,
    createdAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'scan_events_table';
  @override
  VerificationContext validateIntegrity(
    Insertable<ScanEventsTableData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('event_id')) {
      context.handle(
        _eventIdMeta,
        eventId.isAcceptableOrUnknown(data['event_id']!, _eventIdMeta),
      );
    } else if (isInserting) {
      context.missing(_eventIdMeta);
    }
    if (data.containsKey('student_id')) {
      context.handle(
        _studentIdMeta,
        studentId.isAcceptableOrUnknown(data['student_id']!, _studentIdMeta),
      );
    } else if (isInserting) {
      context.missing(_studentIdMeta);
    }
    if (data.containsKey('trip_id')) {
      context.handle(
        _tripIdMeta,
        tripId.isAcceptableOrUnknown(data['trip_id']!, _tripIdMeta),
      );
    } else if (isInserting) {
      context.missing(_tripIdMeta);
    }
    if (data.containsKey('scan_type')) {
      context.handle(
        _scanTypeMeta,
        scanType.isAcceptableOrUnknown(data['scan_type']!, _scanTypeMeta),
      );
    } else if (isInserting) {
      context.missing(_scanTypeMeta);
    }
    if (data.containsKey('timestamp')) {
      context.handle(
        _timestampMeta,
        timestamp.isAcceptableOrUnknown(data['timestamp']!, _timestampMeta),
      );
    } else if (isInserting) {
      context.missing(_timestampMeta);
    }
    if (data.containsKey('sync_status')) {
      context.handle(
        _syncStatusMeta,
        syncStatus.isAcceptableOrUnknown(data['sync_status']!, _syncStatusMeta),
      );
    } else if (isInserting) {
      context.missing(_syncStatusMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  ScanEventsTableData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return ScanEventsTableData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      eventId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}event_id'],
      )!,
      studentId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}student_id'],
      )!,
      tripId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}trip_id'],
      )!,
      scanType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}scan_type'],
      )!,
      timestamp: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}timestamp'],
      )!,
      syncStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sync_status'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $ScanEventsTableTable createAlias(String alias) {
    return $ScanEventsTableTable(attachedDatabase, alias);
  }
}

class ScanEventsTableData extends DataClass
    implements Insertable<ScanEventsTableData> {
  final int id;
  final String eventId;
  final String studentId;
  final String tripId;
  final String scanType;
  final DateTime timestamp;
  final String syncStatus;
  final DateTime createdAt;
  const ScanEventsTableData({
    required this.id,
    required this.eventId,
    required this.studentId,
    required this.tripId,
    required this.scanType,
    required this.timestamp,
    required this.syncStatus,
    required this.createdAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['event_id'] = Variable<String>(eventId);
    map['student_id'] = Variable<String>(studentId);
    map['trip_id'] = Variable<String>(tripId);
    map['scan_type'] = Variable<String>(scanType);
    map['timestamp'] = Variable<DateTime>(timestamp);
    map['sync_status'] = Variable<String>(syncStatus);
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  ScanEventsTableCompanion toCompanion(bool nullToAbsent) {
    return ScanEventsTableCompanion(
      id: Value(id),
      eventId: Value(eventId),
      studentId: Value(studentId),
      tripId: Value(tripId),
      scanType: Value(scanType),
      timestamp: Value(timestamp),
      syncStatus: Value(syncStatus),
      createdAt: Value(createdAt),
    );
  }

  factory ScanEventsTableData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return ScanEventsTableData(
      id: serializer.fromJson<int>(json['id']),
      eventId: serializer.fromJson<String>(json['eventId']),
      studentId: serializer.fromJson<String>(json['studentId']),
      tripId: serializer.fromJson<String>(json['tripId']),
      scanType: serializer.fromJson<String>(json['scanType']),
      timestamp: serializer.fromJson<DateTime>(json['timestamp']),
      syncStatus: serializer.fromJson<String>(json['syncStatus']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'eventId': serializer.toJson<String>(eventId),
      'studentId': serializer.toJson<String>(studentId),
      'tripId': serializer.toJson<String>(tripId),
      'scanType': serializer.toJson<String>(scanType),
      'timestamp': serializer.toJson<DateTime>(timestamp),
      'syncStatus': serializer.toJson<String>(syncStatus),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  ScanEventsTableData copyWith({
    int? id,
    String? eventId,
    String? studentId,
    String? tripId,
    String? scanType,
    DateTime? timestamp,
    String? syncStatus,
    DateTime? createdAt,
  }) => ScanEventsTableData(
    id: id ?? this.id,
    eventId: eventId ?? this.eventId,
    studentId: studentId ?? this.studentId,
    tripId: tripId ?? this.tripId,
    scanType: scanType ?? this.scanType,
    timestamp: timestamp ?? this.timestamp,
    syncStatus: syncStatus ?? this.syncStatus,
    createdAt: createdAt ?? this.createdAt,
  );
  ScanEventsTableData copyWithCompanion(ScanEventsTableCompanion data) {
    return ScanEventsTableData(
      id: data.id.present ? data.id.value : this.id,
      eventId: data.eventId.present ? data.eventId.value : this.eventId,
      studentId: data.studentId.present ? data.studentId.value : this.studentId,
      tripId: data.tripId.present ? data.tripId.value : this.tripId,
      scanType: data.scanType.present ? data.scanType.value : this.scanType,
      timestamp: data.timestamp.present ? data.timestamp.value : this.timestamp,
      syncStatus: data.syncStatus.present
          ? data.syncStatus.value
          : this.syncStatus,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ScanEventsTableData(')
          ..write('id: $id, ')
          ..write('eventId: $eventId, ')
          ..write('studentId: $studentId, ')
          ..write('tripId: $tripId, ')
          ..write('scanType: $scanType, ')
          ..write('timestamp: $timestamp, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    eventId,
    studentId,
    tripId,
    scanType,
    timestamp,
    syncStatus,
    createdAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ScanEventsTableData &&
          other.id == this.id &&
          other.eventId == this.eventId &&
          other.studentId == this.studentId &&
          other.tripId == this.tripId &&
          other.scanType == this.scanType &&
          other.timestamp == this.timestamp &&
          other.syncStatus == this.syncStatus &&
          other.createdAt == this.createdAt);
}

class ScanEventsTableCompanion extends UpdateCompanion<ScanEventsTableData> {
  final Value<int> id;
  final Value<String> eventId;
  final Value<String> studentId;
  final Value<String> tripId;
  final Value<String> scanType;
  final Value<DateTime> timestamp;
  final Value<String> syncStatus;
  final Value<DateTime> createdAt;
  const ScanEventsTableCompanion({
    this.id = const Value.absent(),
    this.eventId = const Value.absent(),
    this.studentId = const Value.absent(),
    this.tripId = const Value.absent(),
    this.scanType = const Value.absent(),
    this.timestamp = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.createdAt = const Value.absent(),
  });
  ScanEventsTableCompanion.insert({
    this.id = const Value.absent(),
    required String eventId,
    required String studentId,
    required String tripId,
    required String scanType,
    required DateTime timestamp,
    required String syncStatus,
    this.createdAt = const Value.absent(),
  }) : eventId = Value(eventId),
       studentId = Value(studentId),
       tripId = Value(tripId),
       scanType = Value(scanType),
       timestamp = Value(timestamp),
       syncStatus = Value(syncStatus);
  static Insertable<ScanEventsTableData> custom({
    Expression<int>? id,
    Expression<String>? eventId,
    Expression<String>? studentId,
    Expression<String>? tripId,
    Expression<String>? scanType,
    Expression<DateTime>? timestamp,
    Expression<String>? syncStatus,
    Expression<DateTime>? createdAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (eventId != null) 'event_id': eventId,
      if (studentId != null) 'student_id': studentId,
      if (tripId != null) 'trip_id': tripId,
      if (scanType != null) 'scan_type': scanType,
      if (timestamp != null) 'timestamp': timestamp,
      if (syncStatus != null) 'sync_status': syncStatus,
      if (createdAt != null) 'created_at': createdAt,
    });
  }

  ScanEventsTableCompanion copyWith({
    Value<int>? id,
    Value<String>? eventId,
    Value<String>? studentId,
    Value<String>? tripId,
    Value<String>? scanType,
    Value<DateTime>? timestamp,
    Value<String>? syncStatus,
    Value<DateTime>? createdAt,
  }) {
    return ScanEventsTableCompanion(
      id: id ?? this.id,
      eventId: eventId ?? this.eventId,
      studentId: studentId ?? this.studentId,
      tripId: tripId ?? this.tripId,
      scanType: scanType ?? this.scanType,
      timestamp: timestamp ?? this.timestamp,
      syncStatus: syncStatus ?? this.syncStatus,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (eventId.present) {
      map['event_id'] = Variable<String>(eventId.value);
    }
    if (studentId.present) {
      map['student_id'] = Variable<String>(studentId.value);
    }
    if (tripId.present) {
      map['trip_id'] = Variable<String>(tripId.value);
    }
    if (scanType.present) {
      map['scan_type'] = Variable<String>(scanType.value);
    }
    if (timestamp.present) {
      map['timestamp'] = Variable<DateTime>(timestamp.value);
    }
    if (syncStatus.present) {
      map['sync_status'] = Variable<String>(syncStatus.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ScanEventsTableCompanion(')
          ..write('id: $id, ')
          ..write('eventId: $eventId, ')
          ..write('studentId: $studentId, ')
          ..write('tripId: $tripId, ')
          ..write('scanType: $scanType, ')
          ..write('timestamp: $timestamp, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }
}

class $LocationEventsTableTable extends LocationEventsTable
    with TableInfo<$LocationEventsTableTable, LocationEventsTableData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocationEventsTableTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _eventIdMeta = const VerificationMeta(
    'eventId',
  );
  @override
  late final GeneratedColumn<String> eventId = GeneratedColumn<String>(
    'event_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _latitudeMeta = const VerificationMeta(
    'latitude',
  );
  @override
  late final GeneratedColumn<double> latitude = GeneratedColumn<double>(
    'latitude',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _longitudeMeta = const VerificationMeta(
    'longitude',
  );
  @override
  late final GeneratedColumn<double> longitude = GeneratedColumn<double>(
    'longitude',
    aliasedName,
    false,
    type: DriftSqlType.double,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _accuracyMeta = const VerificationMeta(
    'accuracy',
  );
  @override
  late final GeneratedColumn<double> accuracy = GeneratedColumn<double>(
    'accuracy',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _speedMeta = const VerificationMeta('speed');
  @override
  late final GeneratedColumn<double> speed = GeneratedColumn<double>(
    'speed',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _headingMeta = const VerificationMeta(
    'heading',
  );
  @override
  late final GeneratedColumn<double> heading = GeneratedColumn<double>(
    'heading',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _timestampMeta = const VerificationMeta(
    'timestamp',
  );
  @override
  late final GeneratedColumn<DateTime> timestamp = GeneratedColumn<DateTime>(
    'timestamp',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _syncStatusMeta = const VerificationMeta(
    'syncStatus',
  );
  @override
  late final GeneratedColumn<String> syncStatus = GeneratedColumn<String>(
    'sync_status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    eventId,
    latitude,
    longitude,
    accuracy,
    speed,
    heading,
    timestamp,
    syncStatus,
    createdAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'location_events_table';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocationEventsTableData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('event_id')) {
      context.handle(
        _eventIdMeta,
        eventId.isAcceptableOrUnknown(data['event_id']!, _eventIdMeta),
      );
    } else if (isInserting) {
      context.missing(_eventIdMeta);
    }
    if (data.containsKey('latitude')) {
      context.handle(
        _latitudeMeta,
        latitude.isAcceptableOrUnknown(data['latitude']!, _latitudeMeta),
      );
    } else if (isInserting) {
      context.missing(_latitudeMeta);
    }
    if (data.containsKey('longitude')) {
      context.handle(
        _longitudeMeta,
        longitude.isAcceptableOrUnknown(data['longitude']!, _longitudeMeta),
      );
    } else if (isInserting) {
      context.missing(_longitudeMeta);
    }
    if (data.containsKey('accuracy')) {
      context.handle(
        _accuracyMeta,
        accuracy.isAcceptableOrUnknown(data['accuracy']!, _accuracyMeta),
      );
    }
    if (data.containsKey('speed')) {
      context.handle(
        _speedMeta,
        speed.isAcceptableOrUnknown(data['speed']!, _speedMeta),
      );
    }
    if (data.containsKey('heading')) {
      context.handle(
        _headingMeta,
        heading.isAcceptableOrUnknown(data['heading']!, _headingMeta),
      );
    }
    if (data.containsKey('timestamp')) {
      context.handle(
        _timestampMeta,
        timestamp.isAcceptableOrUnknown(data['timestamp']!, _timestampMeta),
      );
    } else if (isInserting) {
      context.missing(_timestampMeta);
    }
    if (data.containsKey('sync_status')) {
      context.handle(
        _syncStatusMeta,
        syncStatus.isAcceptableOrUnknown(data['sync_status']!, _syncStatusMeta),
      );
    } else if (isInserting) {
      context.missing(_syncStatusMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocationEventsTableData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocationEventsTableData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      eventId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}event_id'],
      )!,
      latitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}latitude'],
      )!,
      longitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}longitude'],
      )!,
      accuracy: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}accuracy'],
      ),
      speed: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}speed'],
      ),
      heading: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}heading'],
      ),
      timestamp: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}timestamp'],
      )!,
      syncStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sync_status'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $LocationEventsTableTable createAlias(String alias) {
    return $LocationEventsTableTable(attachedDatabase, alias);
  }
}

class LocationEventsTableData extends DataClass
    implements Insertable<LocationEventsTableData> {
  final int id;
  final String eventId;
  final double latitude;
  final double longitude;
  final double? accuracy;
  final double? speed;
  final double? heading;
  final DateTime timestamp;
  final String syncStatus;
  final DateTime createdAt;
  const LocationEventsTableData({
    required this.id,
    required this.eventId,
    required this.latitude,
    required this.longitude,
    this.accuracy,
    this.speed,
    this.heading,
    required this.timestamp,
    required this.syncStatus,
    required this.createdAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['event_id'] = Variable<String>(eventId);
    map['latitude'] = Variable<double>(latitude);
    map['longitude'] = Variable<double>(longitude);
    if (!nullToAbsent || accuracy != null) {
      map['accuracy'] = Variable<double>(accuracy);
    }
    if (!nullToAbsent || speed != null) {
      map['speed'] = Variable<double>(speed);
    }
    if (!nullToAbsent || heading != null) {
      map['heading'] = Variable<double>(heading);
    }
    map['timestamp'] = Variable<DateTime>(timestamp);
    map['sync_status'] = Variable<String>(syncStatus);
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  LocationEventsTableCompanion toCompanion(bool nullToAbsent) {
    return LocationEventsTableCompanion(
      id: Value(id),
      eventId: Value(eventId),
      latitude: Value(latitude),
      longitude: Value(longitude),
      accuracy: accuracy == null && nullToAbsent
          ? const Value.absent()
          : Value(accuracy),
      speed: speed == null && nullToAbsent
          ? const Value.absent()
          : Value(speed),
      heading: heading == null && nullToAbsent
          ? const Value.absent()
          : Value(heading),
      timestamp: Value(timestamp),
      syncStatus: Value(syncStatus),
      createdAt: Value(createdAt),
    );
  }

  factory LocationEventsTableData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocationEventsTableData(
      id: serializer.fromJson<int>(json['id']),
      eventId: serializer.fromJson<String>(json['eventId']),
      latitude: serializer.fromJson<double>(json['latitude']),
      longitude: serializer.fromJson<double>(json['longitude']),
      accuracy: serializer.fromJson<double?>(json['accuracy']),
      speed: serializer.fromJson<double?>(json['speed']),
      heading: serializer.fromJson<double?>(json['heading']),
      timestamp: serializer.fromJson<DateTime>(json['timestamp']),
      syncStatus: serializer.fromJson<String>(json['syncStatus']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'eventId': serializer.toJson<String>(eventId),
      'latitude': serializer.toJson<double>(latitude),
      'longitude': serializer.toJson<double>(longitude),
      'accuracy': serializer.toJson<double?>(accuracy),
      'speed': serializer.toJson<double?>(speed),
      'heading': serializer.toJson<double?>(heading),
      'timestamp': serializer.toJson<DateTime>(timestamp),
      'syncStatus': serializer.toJson<String>(syncStatus),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  LocationEventsTableData copyWith({
    int? id,
    String? eventId,
    double? latitude,
    double? longitude,
    Value<double?> accuracy = const Value.absent(),
    Value<double?> speed = const Value.absent(),
    Value<double?> heading = const Value.absent(),
    DateTime? timestamp,
    String? syncStatus,
    DateTime? createdAt,
  }) => LocationEventsTableData(
    id: id ?? this.id,
    eventId: eventId ?? this.eventId,
    latitude: latitude ?? this.latitude,
    longitude: longitude ?? this.longitude,
    accuracy: accuracy.present ? accuracy.value : this.accuracy,
    speed: speed.present ? speed.value : this.speed,
    heading: heading.present ? heading.value : this.heading,
    timestamp: timestamp ?? this.timestamp,
    syncStatus: syncStatus ?? this.syncStatus,
    createdAt: createdAt ?? this.createdAt,
  );
  LocationEventsTableData copyWithCompanion(LocationEventsTableCompanion data) {
    return LocationEventsTableData(
      id: data.id.present ? data.id.value : this.id,
      eventId: data.eventId.present ? data.eventId.value : this.eventId,
      latitude: data.latitude.present ? data.latitude.value : this.latitude,
      longitude: data.longitude.present ? data.longitude.value : this.longitude,
      accuracy: data.accuracy.present ? data.accuracy.value : this.accuracy,
      speed: data.speed.present ? data.speed.value : this.speed,
      heading: data.heading.present ? data.heading.value : this.heading,
      timestamp: data.timestamp.present ? data.timestamp.value : this.timestamp,
      syncStatus: data.syncStatus.present
          ? data.syncStatus.value
          : this.syncStatus,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocationEventsTableData(')
          ..write('id: $id, ')
          ..write('eventId: $eventId, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('accuracy: $accuracy, ')
          ..write('speed: $speed, ')
          ..write('heading: $heading, ')
          ..write('timestamp: $timestamp, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    eventId,
    latitude,
    longitude,
    accuracy,
    speed,
    heading,
    timestamp,
    syncStatus,
    createdAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocationEventsTableData &&
          other.id == this.id &&
          other.eventId == this.eventId &&
          other.latitude == this.latitude &&
          other.longitude == this.longitude &&
          other.accuracy == this.accuracy &&
          other.speed == this.speed &&
          other.heading == this.heading &&
          other.timestamp == this.timestamp &&
          other.syncStatus == this.syncStatus &&
          other.createdAt == this.createdAt);
}

class LocationEventsTableCompanion
    extends UpdateCompanion<LocationEventsTableData> {
  final Value<int> id;
  final Value<String> eventId;
  final Value<double> latitude;
  final Value<double> longitude;
  final Value<double?> accuracy;
  final Value<double?> speed;
  final Value<double?> heading;
  final Value<DateTime> timestamp;
  final Value<String> syncStatus;
  final Value<DateTime> createdAt;
  const LocationEventsTableCompanion({
    this.id = const Value.absent(),
    this.eventId = const Value.absent(),
    this.latitude = const Value.absent(),
    this.longitude = const Value.absent(),
    this.accuracy = const Value.absent(),
    this.speed = const Value.absent(),
    this.heading = const Value.absent(),
    this.timestamp = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.createdAt = const Value.absent(),
  });
  LocationEventsTableCompanion.insert({
    this.id = const Value.absent(),
    required String eventId,
    required double latitude,
    required double longitude,
    this.accuracy = const Value.absent(),
    this.speed = const Value.absent(),
    this.heading = const Value.absent(),
    required DateTime timestamp,
    required String syncStatus,
    this.createdAt = const Value.absent(),
  }) : eventId = Value(eventId),
       latitude = Value(latitude),
       longitude = Value(longitude),
       timestamp = Value(timestamp),
       syncStatus = Value(syncStatus);
  static Insertable<LocationEventsTableData> custom({
    Expression<int>? id,
    Expression<String>? eventId,
    Expression<double>? latitude,
    Expression<double>? longitude,
    Expression<double>? accuracy,
    Expression<double>? speed,
    Expression<double>? heading,
    Expression<DateTime>? timestamp,
    Expression<String>? syncStatus,
    Expression<DateTime>? createdAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (eventId != null) 'event_id': eventId,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (accuracy != null) 'accuracy': accuracy,
      if (speed != null) 'speed': speed,
      if (heading != null) 'heading': heading,
      if (timestamp != null) 'timestamp': timestamp,
      if (syncStatus != null) 'sync_status': syncStatus,
      if (createdAt != null) 'created_at': createdAt,
    });
  }

  LocationEventsTableCompanion copyWith({
    Value<int>? id,
    Value<String>? eventId,
    Value<double>? latitude,
    Value<double>? longitude,
    Value<double?>? accuracy,
    Value<double?>? speed,
    Value<double?>? heading,
    Value<DateTime>? timestamp,
    Value<String>? syncStatus,
    Value<DateTime>? createdAt,
  }) {
    return LocationEventsTableCompanion(
      id: id ?? this.id,
      eventId: eventId ?? this.eventId,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      accuracy: accuracy ?? this.accuracy,
      speed: speed ?? this.speed,
      heading: heading ?? this.heading,
      timestamp: timestamp ?? this.timestamp,
      syncStatus: syncStatus ?? this.syncStatus,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (eventId.present) {
      map['event_id'] = Variable<String>(eventId.value);
    }
    if (latitude.present) {
      map['latitude'] = Variable<double>(latitude.value);
    }
    if (longitude.present) {
      map['longitude'] = Variable<double>(longitude.value);
    }
    if (accuracy.present) {
      map['accuracy'] = Variable<double>(accuracy.value);
    }
    if (speed.present) {
      map['speed'] = Variable<double>(speed.value);
    }
    if (heading.present) {
      map['heading'] = Variable<double>(heading.value);
    }
    if (timestamp.present) {
      map['timestamp'] = Variable<DateTime>(timestamp.value);
    }
    if (syncStatus.present) {
      map['sync_status'] = Variable<String>(syncStatus.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocationEventsTableCompanion(')
          ..write('id: $id, ')
          ..write('eventId: $eventId, ')
          ..write('latitude: $latitude, ')
          ..write('longitude: $longitude, ')
          ..write('accuracy: $accuracy, ')
          ..write('speed: $speed, ')
          ..write('heading: $heading, ')
          ..write('timestamp: $timestamp, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }
}

class $HeartbeatEventsTableTable extends HeartbeatEventsTable
    with TableInfo<$HeartbeatEventsTableTable, HeartbeatEventsTableData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $HeartbeatEventsTableTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _eventIdMeta = const VerificationMeta(
    'eventId',
  );
  @override
  late final GeneratedColumn<String> eventId = GeneratedColumn<String>(
    'event_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _batteryLevelMeta = const VerificationMeta(
    'batteryLevel',
  );
  @override
  late final GeneratedColumn<int> batteryLevel = GeneratedColumn<int>(
    'battery_level',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _isChargingMeta = const VerificationMeta(
    'isCharging',
  );
  @override
  late final GeneratedColumn<int> isCharging = GeneratedColumn<int>(
    'is_charging',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _connectivityTypeMeta = const VerificationMeta(
    'connectivityType',
  );
  @override
  late final GeneratedColumn<String> connectivityType = GeneratedColumn<String>(
    'connectivity_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _gpsStatusMeta = const VerificationMeta(
    'gpsStatus',
  );
  @override
  late final GeneratedColumn<String> gpsStatus = GeneratedColumn<String>(
    'gps_status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _appVersionMeta = const VerificationMeta(
    'appVersion',
  );
  @override
  late final GeneratedColumn<String> appVersion = GeneratedColumn<String>(
    'app_version',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _deviceModelMeta = const VerificationMeta(
    'deviceModel',
  );
  @override
  late final GeneratedColumn<String> deviceModel = GeneratedColumn<String>(
    'device_model',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _timestampMeta = const VerificationMeta(
    'timestamp',
  );
  @override
  late final GeneratedColumn<DateTime> timestamp = GeneratedColumn<DateTime>(
    'timestamp',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _syncStatusMeta = const VerificationMeta(
    'syncStatus',
  );
  @override
  late final GeneratedColumn<String> syncStatus = GeneratedColumn<String>(
    'sync_status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    eventId,
    batteryLevel,
    isCharging,
    connectivityType,
    gpsStatus,
    appVersion,
    deviceModel,
    timestamp,
    syncStatus,
    createdAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'heartbeat_events_table';
  @override
  VerificationContext validateIntegrity(
    Insertable<HeartbeatEventsTableData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('event_id')) {
      context.handle(
        _eventIdMeta,
        eventId.isAcceptableOrUnknown(data['event_id']!, _eventIdMeta),
      );
    } else if (isInserting) {
      context.missing(_eventIdMeta);
    }
    if (data.containsKey('battery_level')) {
      context.handle(
        _batteryLevelMeta,
        batteryLevel.isAcceptableOrUnknown(
          data['battery_level']!,
          _batteryLevelMeta,
        ),
      );
    }
    if (data.containsKey('is_charging')) {
      context.handle(
        _isChargingMeta,
        isCharging.isAcceptableOrUnknown(data['is_charging']!, _isChargingMeta),
      );
    }
    if (data.containsKey('connectivity_type')) {
      context.handle(
        _connectivityTypeMeta,
        connectivityType.isAcceptableOrUnknown(
          data['connectivity_type']!,
          _connectivityTypeMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_connectivityTypeMeta);
    }
    if (data.containsKey('gps_status')) {
      context.handle(
        _gpsStatusMeta,
        gpsStatus.isAcceptableOrUnknown(data['gps_status']!, _gpsStatusMeta),
      );
    } else if (isInserting) {
      context.missing(_gpsStatusMeta);
    }
    if (data.containsKey('app_version')) {
      context.handle(
        _appVersionMeta,
        appVersion.isAcceptableOrUnknown(data['app_version']!, _appVersionMeta),
      );
    } else if (isInserting) {
      context.missing(_appVersionMeta);
    }
    if (data.containsKey('device_model')) {
      context.handle(
        _deviceModelMeta,
        deviceModel.isAcceptableOrUnknown(
          data['device_model']!,
          _deviceModelMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_deviceModelMeta);
    }
    if (data.containsKey('timestamp')) {
      context.handle(
        _timestampMeta,
        timestamp.isAcceptableOrUnknown(data['timestamp']!, _timestampMeta),
      );
    } else if (isInserting) {
      context.missing(_timestampMeta);
    }
    if (data.containsKey('sync_status')) {
      context.handle(
        _syncStatusMeta,
        syncStatus.isAcceptableOrUnknown(data['sync_status']!, _syncStatusMeta),
      );
    } else if (isInserting) {
      context.missing(_syncStatusMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  HeartbeatEventsTableData map(
    Map<String, dynamic> data, {
    String? tablePrefix,
  }) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return HeartbeatEventsTableData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      eventId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}event_id'],
      )!,
      batteryLevel: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}battery_level'],
      ),
      isCharging: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}is_charging'],
      )!,
      connectivityType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}connectivity_type'],
      )!,
      gpsStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}gps_status'],
      )!,
      appVersion: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}app_version'],
      )!,
      deviceModel: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}device_model'],
      )!,
      timestamp: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}timestamp'],
      )!,
      syncStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sync_status'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $HeartbeatEventsTableTable createAlias(String alias) {
    return $HeartbeatEventsTableTable(attachedDatabase, alias);
  }
}

class HeartbeatEventsTableData extends DataClass
    implements Insertable<HeartbeatEventsTableData> {
  final int id;
  final String eventId;
  final int? batteryLevel;
  final int isCharging;
  final String connectivityType;
  final String gpsStatus;
  final String appVersion;
  final String deviceModel;
  final DateTime timestamp;
  final String syncStatus;
  final DateTime createdAt;
  const HeartbeatEventsTableData({
    required this.id,
    required this.eventId,
    this.batteryLevel,
    required this.isCharging,
    required this.connectivityType,
    required this.gpsStatus,
    required this.appVersion,
    required this.deviceModel,
    required this.timestamp,
    required this.syncStatus,
    required this.createdAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['event_id'] = Variable<String>(eventId);
    if (!nullToAbsent || batteryLevel != null) {
      map['battery_level'] = Variable<int>(batteryLevel);
    }
    map['is_charging'] = Variable<int>(isCharging);
    map['connectivity_type'] = Variable<String>(connectivityType);
    map['gps_status'] = Variable<String>(gpsStatus);
    map['app_version'] = Variable<String>(appVersion);
    map['device_model'] = Variable<String>(deviceModel);
    map['timestamp'] = Variable<DateTime>(timestamp);
    map['sync_status'] = Variable<String>(syncStatus);
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  HeartbeatEventsTableCompanion toCompanion(bool nullToAbsent) {
    return HeartbeatEventsTableCompanion(
      id: Value(id),
      eventId: Value(eventId),
      batteryLevel: batteryLevel == null && nullToAbsent
          ? const Value.absent()
          : Value(batteryLevel),
      isCharging: Value(isCharging),
      connectivityType: Value(connectivityType),
      gpsStatus: Value(gpsStatus),
      appVersion: Value(appVersion),
      deviceModel: Value(deviceModel),
      timestamp: Value(timestamp),
      syncStatus: Value(syncStatus),
      createdAt: Value(createdAt),
    );
  }

  factory HeartbeatEventsTableData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return HeartbeatEventsTableData(
      id: serializer.fromJson<int>(json['id']),
      eventId: serializer.fromJson<String>(json['eventId']),
      batteryLevel: serializer.fromJson<int?>(json['batteryLevel']),
      isCharging: serializer.fromJson<int>(json['isCharging']),
      connectivityType: serializer.fromJson<String>(json['connectivityType']),
      gpsStatus: serializer.fromJson<String>(json['gpsStatus']),
      appVersion: serializer.fromJson<String>(json['appVersion']),
      deviceModel: serializer.fromJson<String>(json['deviceModel']),
      timestamp: serializer.fromJson<DateTime>(json['timestamp']),
      syncStatus: serializer.fromJson<String>(json['syncStatus']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'eventId': serializer.toJson<String>(eventId),
      'batteryLevel': serializer.toJson<int?>(batteryLevel),
      'isCharging': serializer.toJson<int>(isCharging),
      'connectivityType': serializer.toJson<String>(connectivityType),
      'gpsStatus': serializer.toJson<String>(gpsStatus),
      'appVersion': serializer.toJson<String>(appVersion),
      'deviceModel': serializer.toJson<String>(deviceModel),
      'timestamp': serializer.toJson<DateTime>(timestamp),
      'syncStatus': serializer.toJson<String>(syncStatus),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  HeartbeatEventsTableData copyWith({
    int? id,
    String? eventId,
    Value<int?> batteryLevel = const Value.absent(),
    int? isCharging,
    String? connectivityType,
    String? gpsStatus,
    String? appVersion,
    String? deviceModel,
    DateTime? timestamp,
    String? syncStatus,
    DateTime? createdAt,
  }) => HeartbeatEventsTableData(
    id: id ?? this.id,
    eventId: eventId ?? this.eventId,
    batteryLevel: batteryLevel.present ? batteryLevel.value : this.batteryLevel,
    isCharging: isCharging ?? this.isCharging,
    connectivityType: connectivityType ?? this.connectivityType,
    gpsStatus: gpsStatus ?? this.gpsStatus,
    appVersion: appVersion ?? this.appVersion,
    deviceModel: deviceModel ?? this.deviceModel,
    timestamp: timestamp ?? this.timestamp,
    syncStatus: syncStatus ?? this.syncStatus,
    createdAt: createdAt ?? this.createdAt,
  );
  HeartbeatEventsTableData copyWithCompanion(
    HeartbeatEventsTableCompanion data,
  ) {
    return HeartbeatEventsTableData(
      id: data.id.present ? data.id.value : this.id,
      eventId: data.eventId.present ? data.eventId.value : this.eventId,
      batteryLevel: data.batteryLevel.present
          ? data.batteryLevel.value
          : this.batteryLevel,
      isCharging: data.isCharging.present
          ? data.isCharging.value
          : this.isCharging,
      connectivityType: data.connectivityType.present
          ? data.connectivityType.value
          : this.connectivityType,
      gpsStatus: data.gpsStatus.present ? data.gpsStatus.value : this.gpsStatus,
      appVersion: data.appVersion.present
          ? data.appVersion.value
          : this.appVersion,
      deviceModel: data.deviceModel.present
          ? data.deviceModel.value
          : this.deviceModel,
      timestamp: data.timestamp.present ? data.timestamp.value : this.timestamp,
      syncStatus: data.syncStatus.present
          ? data.syncStatus.value
          : this.syncStatus,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('HeartbeatEventsTableData(')
          ..write('id: $id, ')
          ..write('eventId: $eventId, ')
          ..write('batteryLevel: $batteryLevel, ')
          ..write('isCharging: $isCharging, ')
          ..write('connectivityType: $connectivityType, ')
          ..write('gpsStatus: $gpsStatus, ')
          ..write('appVersion: $appVersion, ')
          ..write('deviceModel: $deviceModel, ')
          ..write('timestamp: $timestamp, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    eventId,
    batteryLevel,
    isCharging,
    connectivityType,
    gpsStatus,
    appVersion,
    deviceModel,
    timestamp,
    syncStatus,
    createdAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is HeartbeatEventsTableData &&
          other.id == this.id &&
          other.eventId == this.eventId &&
          other.batteryLevel == this.batteryLevel &&
          other.isCharging == this.isCharging &&
          other.connectivityType == this.connectivityType &&
          other.gpsStatus == this.gpsStatus &&
          other.appVersion == this.appVersion &&
          other.deviceModel == this.deviceModel &&
          other.timestamp == this.timestamp &&
          other.syncStatus == this.syncStatus &&
          other.createdAt == this.createdAt);
}

class HeartbeatEventsTableCompanion
    extends UpdateCompanion<HeartbeatEventsTableData> {
  final Value<int> id;
  final Value<String> eventId;
  final Value<int?> batteryLevel;
  final Value<int> isCharging;
  final Value<String> connectivityType;
  final Value<String> gpsStatus;
  final Value<String> appVersion;
  final Value<String> deviceModel;
  final Value<DateTime> timestamp;
  final Value<String> syncStatus;
  final Value<DateTime> createdAt;
  const HeartbeatEventsTableCompanion({
    this.id = const Value.absent(),
    this.eventId = const Value.absent(),
    this.batteryLevel = const Value.absent(),
    this.isCharging = const Value.absent(),
    this.connectivityType = const Value.absent(),
    this.gpsStatus = const Value.absent(),
    this.appVersion = const Value.absent(),
    this.deviceModel = const Value.absent(),
    this.timestamp = const Value.absent(),
    this.syncStatus = const Value.absent(),
    this.createdAt = const Value.absent(),
  });
  HeartbeatEventsTableCompanion.insert({
    this.id = const Value.absent(),
    required String eventId,
    this.batteryLevel = const Value.absent(),
    this.isCharging = const Value.absent(),
    required String connectivityType,
    required String gpsStatus,
    required String appVersion,
    required String deviceModel,
    required DateTime timestamp,
    required String syncStatus,
    this.createdAt = const Value.absent(),
  }) : eventId = Value(eventId),
       connectivityType = Value(connectivityType),
       gpsStatus = Value(gpsStatus),
       appVersion = Value(appVersion),
       deviceModel = Value(deviceModel),
       timestamp = Value(timestamp),
       syncStatus = Value(syncStatus);
  static Insertable<HeartbeatEventsTableData> custom({
    Expression<int>? id,
    Expression<String>? eventId,
    Expression<int>? batteryLevel,
    Expression<int>? isCharging,
    Expression<String>? connectivityType,
    Expression<String>? gpsStatus,
    Expression<String>? appVersion,
    Expression<String>? deviceModel,
    Expression<DateTime>? timestamp,
    Expression<String>? syncStatus,
    Expression<DateTime>? createdAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (eventId != null) 'event_id': eventId,
      if (batteryLevel != null) 'battery_level': batteryLevel,
      if (isCharging != null) 'is_charging': isCharging,
      if (connectivityType != null) 'connectivity_type': connectivityType,
      if (gpsStatus != null) 'gps_status': gpsStatus,
      if (appVersion != null) 'app_version': appVersion,
      if (deviceModel != null) 'device_model': deviceModel,
      if (timestamp != null) 'timestamp': timestamp,
      if (syncStatus != null) 'sync_status': syncStatus,
      if (createdAt != null) 'created_at': createdAt,
    });
  }

  HeartbeatEventsTableCompanion copyWith({
    Value<int>? id,
    Value<String>? eventId,
    Value<int?>? batteryLevel,
    Value<int>? isCharging,
    Value<String>? connectivityType,
    Value<String>? gpsStatus,
    Value<String>? appVersion,
    Value<String>? deviceModel,
    Value<DateTime>? timestamp,
    Value<String>? syncStatus,
    Value<DateTime>? createdAt,
  }) {
    return HeartbeatEventsTableCompanion(
      id: id ?? this.id,
      eventId: eventId ?? this.eventId,
      batteryLevel: batteryLevel ?? this.batteryLevel,
      isCharging: isCharging ?? this.isCharging,
      connectivityType: connectivityType ?? this.connectivityType,
      gpsStatus: gpsStatus ?? this.gpsStatus,
      appVersion: appVersion ?? this.appVersion,
      deviceModel: deviceModel ?? this.deviceModel,
      timestamp: timestamp ?? this.timestamp,
      syncStatus: syncStatus ?? this.syncStatus,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (eventId.present) {
      map['event_id'] = Variable<String>(eventId.value);
    }
    if (batteryLevel.present) {
      map['battery_level'] = Variable<int>(batteryLevel.value);
    }
    if (isCharging.present) {
      map['is_charging'] = Variable<int>(isCharging.value);
    }
    if (connectivityType.present) {
      map['connectivity_type'] = Variable<String>(connectivityType.value);
    }
    if (gpsStatus.present) {
      map['gps_status'] = Variable<String>(gpsStatus.value);
    }
    if (appVersion.present) {
      map['app_version'] = Variable<String>(appVersion.value);
    }
    if (deviceModel.present) {
      map['device_model'] = Variable<String>(deviceModel.value);
    }
    if (timestamp.present) {
      map['timestamp'] = Variable<DateTime>(timestamp.value);
    }
    if (syncStatus.present) {
      map['sync_status'] = Variable<String>(syncStatus.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('HeartbeatEventsTableCompanion(')
          ..write('id: $id, ')
          ..write('eventId: $eventId, ')
          ..write('batteryLevel: $batteryLevel, ')
          ..write('isCharging: $isCharging, ')
          ..write('connectivityType: $connectivityType, ')
          ..write('gpsStatus: $gpsStatus, ')
          ..write('appVersion: $appVersion, ')
          ..write('deviceModel: $deviceModel, ')
          ..write('timestamp: $timestamp, ')
          ..write('syncStatus: $syncStatus, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }
}

class $SyncMetadataTableTable extends SyncMetadataTable
    with TableInfo<$SyncMetadataTableTable, SyncMetadataTableData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncMetadataTableTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _entityTypeMeta = const VerificationMeta(
    'entityType',
  );
  @override
  late final GeneratedColumn<String> entityType = GeneratedColumn<String>(
    'entity_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _entityIdMeta = const VerificationMeta(
    'entityId',
  );
  @override
  late final GeneratedColumn<String> entityId = GeneratedColumn<String>(
    'entity_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _lastSyncedMeta = const VerificationMeta(
    'lastSynced',
  );
  @override
  late final GeneratedColumn<DateTime> lastSynced = GeneratedColumn<DateTime>(
    'last_synced',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    entityType,
    entityId,
    lastSynced,
    status,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_metadata_table';
  @override
  VerificationContext validateIntegrity(
    Insertable<SyncMetadataTableData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('entity_type')) {
      context.handle(
        _entityTypeMeta,
        entityType.isAcceptableOrUnknown(data['entity_type']!, _entityTypeMeta),
      );
    } else if (isInserting) {
      context.missing(_entityTypeMeta);
    }
    if (data.containsKey('entity_id')) {
      context.handle(
        _entityIdMeta,
        entityId.isAcceptableOrUnknown(data['entity_id']!, _entityIdMeta),
      );
    } else if (isInserting) {
      context.missing(_entityIdMeta);
    }
    if (data.containsKey('last_synced')) {
      context.handle(
        _lastSyncedMeta,
        lastSynced.isAcceptableOrUnknown(data['last_synced']!, _lastSyncedMeta),
      );
    } else if (isInserting) {
      context.missing(_lastSyncedMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  SyncMetadataTableData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncMetadataTableData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      entityType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}entity_type'],
      )!,
      entityId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}entity_id'],
      )!,
      lastSynced: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}last_synced'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $SyncMetadataTableTable createAlias(String alias) {
    return $SyncMetadataTableTable(attachedDatabase, alias);
  }
}

class SyncMetadataTableData extends DataClass
    implements Insertable<SyncMetadataTableData> {
  final int id;
  final String entityType;
  final String entityId;
  final DateTime lastSynced;
  final String status;
  final DateTime updatedAt;
  const SyncMetadataTableData({
    required this.id,
    required this.entityType,
    required this.entityId,
    required this.lastSynced,
    required this.status,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['entity_type'] = Variable<String>(entityType);
    map['entity_id'] = Variable<String>(entityId);
    map['last_synced'] = Variable<DateTime>(lastSynced);
    map['status'] = Variable<String>(status);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  SyncMetadataTableCompanion toCompanion(bool nullToAbsent) {
    return SyncMetadataTableCompanion(
      id: Value(id),
      entityType: Value(entityType),
      entityId: Value(entityId),
      lastSynced: Value(lastSynced),
      status: Value(status),
      updatedAt: Value(updatedAt),
    );
  }

  factory SyncMetadataTableData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncMetadataTableData(
      id: serializer.fromJson<int>(json['id']),
      entityType: serializer.fromJson<String>(json['entityType']),
      entityId: serializer.fromJson<String>(json['entityId']),
      lastSynced: serializer.fromJson<DateTime>(json['lastSynced']),
      status: serializer.fromJson<String>(json['status']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'entityType': serializer.toJson<String>(entityType),
      'entityId': serializer.toJson<String>(entityId),
      'lastSynced': serializer.toJson<DateTime>(lastSynced),
      'status': serializer.toJson<String>(status),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  SyncMetadataTableData copyWith({
    int? id,
    String? entityType,
    String? entityId,
    DateTime? lastSynced,
    String? status,
    DateTime? updatedAt,
  }) => SyncMetadataTableData(
    id: id ?? this.id,
    entityType: entityType ?? this.entityType,
    entityId: entityId ?? this.entityId,
    lastSynced: lastSynced ?? this.lastSynced,
    status: status ?? this.status,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  SyncMetadataTableData copyWithCompanion(SyncMetadataTableCompanion data) {
    return SyncMetadataTableData(
      id: data.id.present ? data.id.value : this.id,
      entityType: data.entityType.present
          ? data.entityType.value
          : this.entityType,
      entityId: data.entityId.present ? data.entityId.value : this.entityId,
      lastSynced: data.lastSynced.present
          ? data.lastSynced.value
          : this.lastSynced,
      status: data.status.present ? data.status.value : this.status,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncMetadataTableData(')
          ..write('id: $id, ')
          ..write('entityType: $entityType, ')
          ..write('entityId: $entityId, ')
          ..write('lastSynced: $lastSynced, ')
          ..write('status: $status, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, entityType, entityId, lastSynced, status, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncMetadataTableData &&
          other.id == this.id &&
          other.entityType == this.entityType &&
          other.entityId == this.entityId &&
          other.lastSynced == this.lastSynced &&
          other.status == this.status &&
          other.updatedAt == this.updatedAt);
}

class SyncMetadataTableCompanion
    extends UpdateCompanion<SyncMetadataTableData> {
  final Value<int> id;
  final Value<String> entityType;
  final Value<String> entityId;
  final Value<DateTime> lastSynced;
  final Value<String> status;
  final Value<DateTime> updatedAt;
  const SyncMetadataTableCompanion({
    this.id = const Value.absent(),
    this.entityType = const Value.absent(),
    this.entityId = const Value.absent(),
    this.lastSynced = const Value.absent(),
    this.status = const Value.absent(),
    this.updatedAt = const Value.absent(),
  });
  SyncMetadataTableCompanion.insert({
    this.id = const Value.absent(),
    required String entityType,
    required String entityId,
    required DateTime lastSynced,
    required String status,
    this.updatedAt = const Value.absent(),
  }) : entityType = Value(entityType),
       entityId = Value(entityId),
       lastSynced = Value(lastSynced),
       status = Value(status);
  static Insertable<SyncMetadataTableData> custom({
    Expression<int>? id,
    Expression<String>? entityType,
    Expression<String>? entityId,
    Expression<DateTime>? lastSynced,
    Expression<String>? status,
    Expression<DateTime>? updatedAt,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (entityType != null) 'entity_type': entityType,
      if (entityId != null) 'entity_id': entityId,
      if (lastSynced != null) 'last_synced': lastSynced,
      if (status != null) 'status': status,
      if (updatedAt != null) 'updated_at': updatedAt,
    });
  }

  SyncMetadataTableCompanion copyWith({
    Value<int>? id,
    Value<String>? entityType,
    Value<String>? entityId,
    Value<DateTime>? lastSynced,
    Value<String>? status,
    Value<DateTime>? updatedAt,
  }) {
    return SyncMetadataTableCompanion(
      id: id ?? this.id,
      entityType: entityType ?? this.entityType,
      entityId: entityId ?? this.entityId,
      lastSynced: lastSynced ?? this.lastSynced,
      status: status ?? this.status,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (entityType.present) {
      map['entity_type'] = Variable<String>(entityType.value);
    }
    if (entityId.present) {
      map['entity_id'] = Variable<String>(entityId.value);
    }
    if (lastSynced.present) {
      map['last_synced'] = Variable<DateTime>(lastSynced.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncMetadataTableCompanion(')
          ..write('id: $id, ')
          ..write('entityType: $entityType, ')
          ..write('entityId: $entityId, ')
          ..write('lastSynced: $lastSynced, ')
          ..write('status: $status, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }
}

class $LogEntriesTableTable extends LogEntriesTable
    with TableInfo<$LogEntriesTableTable, LogEntriesTableData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LogEntriesTableTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _timestampMeta = const VerificationMeta(
    'timestamp',
  );
  @override
  late final GeneratedColumn<DateTime> timestamp = GeneratedColumn<DateTime>(
    'timestamp',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _levelMeta = const VerificationMeta('level');
  @override
  late final GeneratedColumn<String> level = GeneratedColumn<String>(
    'level',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _categoryMeta = const VerificationMeta(
    'category',
  );
  @override
  late final GeneratedColumn<String> category = GeneratedColumn<String>(
    'category',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _eventIdMeta = const VerificationMeta(
    'eventId',
  );
  @override
  late final GeneratedColumn<String> eventId = GeneratedColumn<String>(
    'event_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _tripIdMeta = const VerificationMeta('tripId');
  @override
  late final GeneratedColumn<String> tripId = GeneratedColumn<String>(
    'trip_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _messageMeta = const VerificationMeta(
    'message',
  );
  @override
  late final GeneratedColumn<String> message = GeneratedColumn<String>(
    'message',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _metadataJsonMeta = const VerificationMeta(
    'metadataJson',
  );
  @override
  late final GeneratedColumn<String> metadataJson = GeneratedColumn<String>(
    'metadata_json',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    timestamp,
    level,
    category,
    eventId,
    tripId,
    message,
    metadataJson,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'log_entries_table';
  @override
  VerificationContext validateIntegrity(
    Insertable<LogEntriesTableData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('timestamp')) {
      context.handle(
        _timestampMeta,
        timestamp.isAcceptableOrUnknown(data['timestamp']!, _timestampMeta),
      );
    } else if (isInserting) {
      context.missing(_timestampMeta);
    }
    if (data.containsKey('level')) {
      context.handle(
        _levelMeta,
        level.isAcceptableOrUnknown(data['level']!, _levelMeta),
      );
    } else if (isInserting) {
      context.missing(_levelMeta);
    }
    if (data.containsKey('category')) {
      context.handle(
        _categoryMeta,
        category.isAcceptableOrUnknown(data['category']!, _categoryMeta),
      );
    } else if (isInserting) {
      context.missing(_categoryMeta);
    }
    if (data.containsKey('event_id')) {
      context.handle(
        _eventIdMeta,
        eventId.isAcceptableOrUnknown(data['event_id']!, _eventIdMeta),
      );
    }
    if (data.containsKey('trip_id')) {
      context.handle(
        _tripIdMeta,
        tripId.isAcceptableOrUnknown(data['trip_id']!, _tripIdMeta),
      );
    }
    if (data.containsKey('message')) {
      context.handle(
        _messageMeta,
        message.isAcceptableOrUnknown(data['message']!, _messageMeta),
      );
    } else if (isInserting) {
      context.missing(_messageMeta);
    }
    if (data.containsKey('metadata_json')) {
      context.handle(
        _metadataJsonMeta,
        metadataJson.isAcceptableOrUnknown(
          data['metadata_json']!,
          _metadataJsonMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LogEntriesTableData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LogEntriesTableData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      timestamp: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}timestamp'],
      )!,
      level: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}level'],
      )!,
      category: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}category'],
      )!,
      eventId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}event_id'],
      ),
      tripId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}trip_id'],
      ),
      message: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}message'],
      )!,
      metadataJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}metadata_json'],
      ),
    );
  }

  @override
  $LogEntriesTableTable createAlias(String alias) {
    return $LogEntriesTableTable(attachedDatabase, alias);
  }
}

class LogEntriesTableData extends DataClass
    implements Insertable<LogEntriesTableData> {
  final int id;
  final DateTime timestamp;
  final String level;
  final String category;
  final String? eventId;
  final String? tripId;
  final String message;
  final String? metadataJson;
  const LogEntriesTableData({
    required this.id,
    required this.timestamp,
    required this.level,
    required this.category,
    this.eventId,
    this.tripId,
    required this.message,
    this.metadataJson,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['timestamp'] = Variable<DateTime>(timestamp);
    map['level'] = Variable<String>(level);
    map['category'] = Variable<String>(category);
    if (!nullToAbsent || eventId != null) {
      map['event_id'] = Variable<String>(eventId);
    }
    if (!nullToAbsent || tripId != null) {
      map['trip_id'] = Variable<String>(tripId);
    }
    map['message'] = Variable<String>(message);
    if (!nullToAbsent || metadataJson != null) {
      map['metadata_json'] = Variable<String>(metadataJson);
    }
    return map;
  }

  LogEntriesTableCompanion toCompanion(bool nullToAbsent) {
    return LogEntriesTableCompanion(
      id: Value(id),
      timestamp: Value(timestamp),
      level: Value(level),
      category: Value(category),
      eventId: eventId == null && nullToAbsent
          ? const Value.absent()
          : Value(eventId),
      tripId: tripId == null && nullToAbsent
          ? const Value.absent()
          : Value(tripId),
      message: Value(message),
      metadataJson: metadataJson == null && nullToAbsent
          ? const Value.absent()
          : Value(metadataJson),
    );
  }

  factory LogEntriesTableData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LogEntriesTableData(
      id: serializer.fromJson<int>(json['id']),
      timestamp: serializer.fromJson<DateTime>(json['timestamp']),
      level: serializer.fromJson<String>(json['level']),
      category: serializer.fromJson<String>(json['category']),
      eventId: serializer.fromJson<String?>(json['eventId']),
      tripId: serializer.fromJson<String?>(json['tripId']),
      message: serializer.fromJson<String>(json['message']),
      metadataJson: serializer.fromJson<String?>(json['metadataJson']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'timestamp': serializer.toJson<DateTime>(timestamp),
      'level': serializer.toJson<String>(level),
      'category': serializer.toJson<String>(category),
      'eventId': serializer.toJson<String?>(eventId),
      'tripId': serializer.toJson<String?>(tripId),
      'message': serializer.toJson<String>(message),
      'metadataJson': serializer.toJson<String?>(metadataJson),
    };
  }

  LogEntriesTableData copyWith({
    int? id,
    DateTime? timestamp,
    String? level,
    String? category,
    Value<String?> eventId = const Value.absent(),
    Value<String?> tripId = const Value.absent(),
    String? message,
    Value<String?> metadataJson = const Value.absent(),
  }) => LogEntriesTableData(
    id: id ?? this.id,
    timestamp: timestamp ?? this.timestamp,
    level: level ?? this.level,
    category: category ?? this.category,
    eventId: eventId.present ? eventId.value : this.eventId,
    tripId: tripId.present ? tripId.value : this.tripId,
    message: message ?? this.message,
    metadataJson: metadataJson.present ? metadataJson.value : this.metadataJson,
  );
  LogEntriesTableData copyWithCompanion(LogEntriesTableCompanion data) {
    return LogEntriesTableData(
      id: data.id.present ? data.id.value : this.id,
      timestamp: data.timestamp.present ? data.timestamp.value : this.timestamp,
      level: data.level.present ? data.level.value : this.level,
      category: data.category.present ? data.category.value : this.category,
      eventId: data.eventId.present ? data.eventId.value : this.eventId,
      tripId: data.tripId.present ? data.tripId.value : this.tripId,
      message: data.message.present ? data.message.value : this.message,
      metadataJson: data.metadataJson.present
          ? data.metadataJson.value
          : this.metadataJson,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LogEntriesTableData(')
          ..write('id: $id, ')
          ..write('timestamp: $timestamp, ')
          ..write('level: $level, ')
          ..write('category: $category, ')
          ..write('eventId: $eventId, ')
          ..write('tripId: $tripId, ')
          ..write('message: $message, ')
          ..write('metadataJson: $metadataJson')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    timestamp,
    level,
    category,
    eventId,
    tripId,
    message,
    metadataJson,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LogEntriesTableData &&
          other.id == this.id &&
          other.timestamp == this.timestamp &&
          other.level == this.level &&
          other.category == this.category &&
          other.eventId == this.eventId &&
          other.tripId == this.tripId &&
          other.message == this.message &&
          other.metadataJson == this.metadataJson);
}

class LogEntriesTableCompanion extends UpdateCompanion<LogEntriesTableData> {
  final Value<int> id;
  final Value<DateTime> timestamp;
  final Value<String> level;
  final Value<String> category;
  final Value<String?> eventId;
  final Value<String?> tripId;
  final Value<String> message;
  final Value<String?> metadataJson;
  const LogEntriesTableCompanion({
    this.id = const Value.absent(),
    this.timestamp = const Value.absent(),
    this.level = const Value.absent(),
    this.category = const Value.absent(),
    this.eventId = const Value.absent(),
    this.tripId = const Value.absent(),
    this.message = const Value.absent(),
    this.metadataJson = const Value.absent(),
  });
  LogEntriesTableCompanion.insert({
    this.id = const Value.absent(),
    required DateTime timestamp,
    required String level,
    required String category,
    this.eventId = const Value.absent(),
    this.tripId = const Value.absent(),
    required String message,
    this.metadataJson = const Value.absent(),
  }) : timestamp = Value(timestamp),
       level = Value(level),
       category = Value(category),
       message = Value(message);
  static Insertable<LogEntriesTableData> custom({
    Expression<int>? id,
    Expression<DateTime>? timestamp,
    Expression<String>? level,
    Expression<String>? category,
    Expression<String>? eventId,
    Expression<String>? tripId,
    Expression<String>? message,
    Expression<String>? metadataJson,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (timestamp != null) 'timestamp': timestamp,
      if (level != null) 'level': level,
      if (category != null) 'category': category,
      if (eventId != null) 'event_id': eventId,
      if (tripId != null) 'trip_id': tripId,
      if (message != null) 'message': message,
      if (metadataJson != null) 'metadata_json': metadataJson,
    });
  }

  LogEntriesTableCompanion copyWith({
    Value<int>? id,
    Value<DateTime>? timestamp,
    Value<String>? level,
    Value<String>? category,
    Value<String?>? eventId,
    Value<String?>? tripId,
    Value<String>? message,
    Value<String?>? metadataJson,
  }) {
    return LogEntriesTableCompanion(
      id: id ?? this.id,
      timestamp: timestamp ?? this.timestamp,
      level: level ?? this.level,
      category: category ?? this.category,
      eventId: eventId ?? this.eventId,
      tripId: tripId ?? this.tripId,
      message: message ?? this.message,
      metadataJson: metadataJson ?? this.metadataJson,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (timestamp.present) {
      map['timestamp'] = Variable<DateTime>(timestamp.value);
    }
    if (level.present) {
      map['level'] = Variable<String>(level.value);
    }
    if (category.present) {
      map['category'] = Variable<String>(category.value);
    }
    if (eventId.present) {
      map['event_id'] = Variable<String>(eventId.value);
    }
    if (tripId.present) {
      map['trip_id'] = Variable<String>(tripId.value);
    }
    if (message.present) {
      map['message'] = Variable<String>(message.value);
    }
    if (metadataJson.present) {
      map['metadata_json'] = Variable<String>(metadataJson.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LogEntriesTableCompanion(')
          ..write('id: $id, ')
          ..write('timestamp: $timestamp, ')
          ..write('level: $level, ')
          ..write('category: $category, ')
          ..write('eventId: $eventId, ')
          ..write('tripId: $tripId, ')
          ..write('message: $message, ')
          ..write('metadataJson: $metadataJson')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  _$AppDatabase.connect(DatabaseConnection c) : super.connect(c);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $DeviceStateTableTable deviceStateTable = $DeviceStateTableTable(
    this,
  );
  late final $MqttQueueTableTable mqttQueueTable = $MqttQueueTableTable(this);
  late final $ScanEventsTableTable scanEventsTable = $ScanEventsTableTable(
    this,
  );
  late final $LocationEventsTableTable locationEventsTable =
      $LocationEventsTableTable(this);
  late final $HeartbeatEventsTableTable heartbeatEventsTable =
      $HeartbeatEventsTableTable(this);
  late final $SyncMetadataTableTable syncMetadataTable =
      $SyncMetadataTableTable(this);
  late final $LogEntriesTableTable logEntriesTable = $LogEntriesTableTable(
    this,
  );
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    deviceStateTable,
    mqttQueueTable,
    scanEventsTable,
    locationEventsTable,
    heartbeatEventsTable,
    syncMetadataTable,
    logEntriesTable,
  ];
}

typedef $$DeviceStateTableTableCreateCompanionBuilder =
    DeviceStateTableCompanion Function({
      required String key,
      required String value,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });
typedef $$DeviceStateTableTableUpdateCompanionBuilder =
    DeviceStateTableCompanion Function({
      Value<String> key,
      Value<String> value,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$DeviceStateTableTableFilterComposer
    extends Composer<_$AppDatabase, $DeviceStateTableTable> {
  $$DeviceStateTableTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$DeviceStateTableTableOrderingComposer
    extends Composer<_$AppDatabase, $DeviceStateTableTable> {
  $$DeviceStateTableTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get key => $composableBuilder(
    column: $table.key,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get value => $composableBuilder(
    column: $table.value,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$DeviceStateTableTableAnnotationComposer
    extends Composer<_$AppDatabase, $DeviceStateTableTable> {
  $$DeviceStateTableTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get key =>
      $composableBuilder(column: $table.key, builder: (column) => column);

  GeneratedColumn<String> get value =>
      $composableBuilder(column: $table.value, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$DeviceStateTableTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $DeviceStateTableTable,
          DeviceStateTableData,
          $$DeviceStateTableTableFilterComposer,
          $$DeviceStateTableTableOrderingComposer,
          $$DeviceStateTableTableAnnotationComposer,
          $$DeviceStateTableTableCreateCompanionBuilder,
          $$DeviceStateTableTableUpdateCompanionBuilder,
          (
            DeviceStateTableData,
            BaseReferences<
              _$AppDatabase,
              $DeviceStateTableTable,
              DeviceStateTableData
            >,
          ),
          DeviceStateTableData,
          PrefetchHooks Function()
        > {
  $$DeviceStateTableTableTableManager(
    _$AppDatabase db,
    $DeviceStateTableTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$DeviceStateTableTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$DeviceStateTableTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$DeviceStateTableTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> key = const Value.absent(),
                Value<String> value = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => DeviceStateTableCompanion(
                key: key,
                value: value,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String key,
                required String value,
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => DeviceStateTableCompanion.insert(
                key: key,
                value: value,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$DeviceStateTableTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $DeviceStateTableTable,
      DeviceStateTableData,
      $$DeviceStateTableTableFilterComposer,
      $$DeviceStateTableTableOrderingComposer,
      $$DeviceStateTableTableAnnotationComposer,
      $$DeviceStateTableTableCreateCompanionBuilder,
      $$DeviceStateTableTableUpdateCompanionBuilder,
      (
        DeviceStateTableData,
        BaseReferences<
          _$AppDatabase,
          $DeviceStateTableTable,
          DeviceStateTableData
        >,
      ),
      DeviceStateTableData,
      PrefetchHooks Function()
    >;
typedef $$MqttQueueTableTableCreateCompanionBuilder =
    MqttQueueTableCompanion Function({
      required String eventId,
      required String topic,
      required String payload,
      Value<int> qos,
      Value<int> retain,
      required String status,
      Value<int> retryCount,
      Value<int> maxRetries,
      Value<DateTime?> lastAttempt,
      Value<DateTime?> nextRetry,
      Value<String?> lastError,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });
typedef $$MqttQueueTableTableUpdateCompanionBuilder =
    MqttQueueTableCompanion Function({
      Value<String> eventId,
      Value<String> topic,
      Value<String> payload,
      Value<int> qos,
      Value<int> retain,
      Value<String> status,
      Value<int> retryCount,
      Value<int> maxRetries,
      Value<DateTime?> lastAttempt,
      Value<DateTime?> nextRetry,
      Value<String?> lastError,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$MqttQueueTableTableFilterComposer
    extends Composer<_$AppDatabase, $MqttQueueTableTable> {
  $$MqttQueueTableTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get eventId => $composableBuilder(
    column: $table.eventId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get topic => $composableBuilder(
    column: $table.topic,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get qos => $composableBuilder(
    column: $table.qos,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get retain => $composableBuilder(
    column: $table.retain,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get retryCount => $composableBuilder(
    column: $table.retryCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get maxRetries => $composableBuilder(
    column: $table.maxRetries,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastAttempt => $composableBuilder(
    column: $table.lastAttempt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get nextRetry => $composableBuilder(
    column: $table.nextRetry,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get lastError => $composableBuilder(
    column: $table.lastError,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$MqttQueueTableTableOrderingComposer
    extends Composer<_$AppDatabase, $MqttQueueTableTable> {
  $$MqttQueueTableTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get eventId => $composableBuilder(
    column: $table.eventId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get topic => $composableBuilder(
    column: $table.topic,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get qos => $composableBuilder(
    column: $table.qos,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get retain => $composableBuilder(
    column: $table.retain,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get retryCount => $composableBuilder(
    column: $table.retryCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get maxRetries => $composableBuilder(
    column: $table.maxRetries,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastAttempt => $composableBuilder(
    column: $table.lastAttempt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get nextRetry => $composableBuilder(
    column: $table.nextRetry,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get lastError => $composableBuilder(
    column: $table.lastError,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$MqttQueueTableTableAnnotationComposer
    extends Composer<_$AppDatabase, $MqttQueueTableTable> {
  $$MqttQueueTableTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get eventId =>
      $composableBuilder(column: $table.eventId, builder: (column) => column);

  GeneratedColumn<String> get topic =>
      $composableBuilder(column: $table.topic, builder: (column) => column);

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  GeneratedColumn<int> get qos =>
      $composableBuilder(column: $table.qos, builder: (column) => column);

  GeneratedColumn<int> get retain =>
      $composableBuilder(column: $table.retain, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<int> get retryCount => $composableBuilder(
    column: $table.retryCount,
    builder: (column) => column,
  );

  GeneratedColumn<int> get maxRetries => $composableBuilder(
    column: $table.maxRetries,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get lastAttempt => $composableBuilder(
    column: $table.lastAttempt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get nextRetry =>
      $composableBuilder(column: $table.nextRetry, builder: (column) => column);

  GeneratedColumn<String> get lastError =>
      $composableBuilder(column: $table.lastError, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$MqttQueueTableTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $MqttQueueTableTable,
          MqttQueueEntry,
          $$MqttQueueTableTableFilterComposer,
          $$MqttQueueTableTableOrderingComposer,
          $$MqttQueueTableTableAnnotationComposer,
          $$MqttQueueTableTableCreateCompanionBuilder,
          $$MqttQueueTableTableUpdateCompanionBuilder,
          (
            MqttQueueEntry,
            BaseReferences<_$AppDatabase, $MqttQueueTableTable, MqttQueueEntry>,
          ),
          MqttQueueEntry,
          PrefetchHooks Function()
        > {
  $$MqttQueueTableTableTableManager(
    _$AppDatabase db,
    $MqttQueueTableTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$MqttQueueTableTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$MqttQueueTableTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$MqttQueueTableTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> eventId = const Value.absent(),
                Value<String> topic = const Value.absent(),
                Value<String> payload = const Value.absent(),
                Value<int> qos = const Value.absent(),
                Value<int> retain = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<int> retryCount = const Value.absent(),
                Value<int> maxRetries = const Value.absent(),
                Value<DateTime?> lastAttempt = const Value.absent(),
                Value<DateTime?> nextRetry = const Value.absent(),
                Value<String?> lastError = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => MqttQueueTableCompanion(
                eventId: eventId,
                topic: topic,
                payload: payload,
                qos: qos,
                retain: retain,
                status: status,
                retryCount: retryCount,
                maxRetries: maxRetries,
                lastAttempt: lastAttempt,
                nextRetry: nextRetry,
                lastError: lastError,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String eventId,
                required String topic,
                required String payload,
                Value<int> qos = const Value.absent(),
                Value<int> retain = const Value.absent(),
                required String status,
                Value<int> retryCount = const Value.absent(),
                Value<int> maxRetries = const Value.absent(),
                Value<DateTime?> lastAttempt = const Value.absent(),
                Value<DateTime?> nextRetry = const Value.absent(),
                Value<String?> lastError = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => MqttQueueTableCompanion.insert(
                eventId: eventId,
                topic: topic,
                payload: payload,
                qos: qos,
                retain: retain,
                status: status,
                retryCount: retryCount,
                maxRetries: maxRetries,
                lastAttempt: lastAttempt,
                nextRetry: nextRetry,
                lastError: lastError,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$MqttQueueTableTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $MqttQueueTableTable,
      MqttQueueEntry,
      $$MqttQueueTableTableFilterComposer,
      $$MqttQueueTableTableOrderingComposer,
      $$MqttQueueTableTableAnnotationComposer,
      $$MqttQueueTableTableCreateCompanionBuilder,
      $$MqttQueueTableTableUpdateCompanionBuilder,
      (
        MqttQueueEntry,
        BaseReferences<_$AppDatabase, $MqttQueueTableTable, MqttQueueEntry>,
      ),
      MqttQueueEntry,
      PrefetchHooks Function()
    >;
typedef $$ScanEventsTableTableCreateCompanionBuilder =
    ScanEventsTableCompanion Function({
      Value<int> id,
      required String eventId,
      required String studentId,
      required String tripId,
      required String scanType,
      required DateTime timestamp,
      required String syncStatus,
      Value<DateTime> createdAt,
    });
typedef $$ScanEventsTableTableUpdateCompanionBuilder =
    ScanEventsTableCompanion Function({
      Value<int> id,
      Value<String> eventId,
      Value<String> studentId,
      Value<String> tripId,
      Value<String> scanType,
      Value<DateTime> timestamp,
      Value<String> syncStatus,
      Value<DateTime> createdAt,
    });

class $$ScanEventsTableTableFilterComposer
    extends Composer<_$AppDatabase, $ScanEventsTableTable> {
  $$ScanEventsTableTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get eventId => $composableBuilder(
    column: $table.eventId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get studentId => $composableBuilder(
    column: $table.studentId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get tripId => $composableBuilder(
    column: $table.tripId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get scanType => $composableBuilder(
    column: $table.scanType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get timestamp => $composableBuilder(
    column: $table.timestamp,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$ScanEventsTableTableOrderingComposer
    extends Composer<_$AppDatabase, $ScanEventsTableTable> {
  $$ScanEventsTableTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get eventId => $composableBuilder(
    column: $table.eventId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get studentId => $composableBuilder(
    column: $table.studentId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get tripId => $composableBuilder(
    column: $table.tripId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get scanType => $composableBuilder(
    column: $table.scanType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get timestamp => $composableBuilder(
    column: $table.timestamp,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$ScanEventsTableTableAnnotationComposer
    extends Composer<_$AppDatabase, $ScanEventsTableTable> {
  $$ScanEventsTableTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get eventId =>
      $composableBuilder(column: $table.eventId, builder: (column) => column);

  GeneratedColumn<String> get studentId =>
      $composableBuilder(column: $table.studentId, builder: (column) => column);

  GeneratedColumn<String> get tripId =>
      $composableBuilder(column: $table.tripId, builder: (column) => column);

  GeneratedColumn<String> get scanType =>
      $composableBuilder(column: $table.scanType, builder: (column) => column);

  GeneratedColumn<DateTime> get timestamp =>
      $composableBuilder(column: $table.timestamp, builder: (column) => column);

  GeneratedColumn<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$ScanEventsTableTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $ScanEventsTableTable,
          ScanEventsTableData,
          $$ScanEventsTableTableFilterComposer,
          $$ScanEventsTableTableOrderingComposer,
          $$ScanEventsTableTableAnnotationComposer,
          $$ScanEventsTableTableCreateCompanionBuilder,
          $$ScanEventsTableTableUpdateCompanionBuilder,
          (
            ScanEventsTableData,
            BaseReferences<
              _$AppDatabase,
              $ScanEventsTableTable,
              ScanEventsTableData
            >,
          ),
          ScanEventsTableData,
          PrefetchHooks Function()
        > {
  $$ScanEventsTableTableTableManager(
    _$AppDatabase db,
    $ScanEventsTableTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ScanEventsTableTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ScanEventsTableTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ScanEventsTableTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> eventId = const Value.absent(),
                Value<String> studentId = const Value.absent(),
                Value<String> tripId = const Value.absent(),
                Value<String> scanType = const Value.absent(),
                Value<DateTime> timestamp = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
              }) => ScanEventsTableCompanion(
                id: id,
                eventId: eventId,
                studentId: studentId,
                tripId: tripId,
                scanType: scanType,
                timestamp: timestamp,
                syncStatus: syncStatus,
                createdAt: createdAt,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String eventId,
                required String studentId,
                required String tripId,
                required String scanType,
                required DateTime timestamp,
                required String syncStatus,
                Value<DateTime> createdAt = const Value.absent(),
              }) => ScanEventsTableCompanion.insert(
                id: id,
                eventId: eventId,
                studentId: studentId,
                tripId: tripId,
                scanType: scanType,
                timestamp: timestamp,
                syncStatus: syncStatus,
                createdAt: createdAt,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$ScanEventsTableTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $ScanEventsTableTable,
      ScanEventsTableData,
      $$ScanEventsTableTableFilterComposer,
      $$ScanEventsTableTableOrderingComposer,
      $$ScanEventsTableTableAnnotationComposer,
      $$ScanEventsTableTableCreateCompanionBuilder,
      $$ScanEventsTableTableUpdateCompanionBuilder,
      (
        ScanEventsTableData,
        BaseReferences<
          _$AppDatabase,
          $ScanEventsTableTable,
          ScanEventsTableData
        >,
      ),
      ScanEventsTableData,
      PrefetchHooks Function()
    >;
typedef $$LocationEventsTableTableCreateCompanionBuilder =
    LocationEventsTableCompanion Function({
      Value<int> id,
      required String eventId,
      required double latitude,
      required double longitude,
      Value<double?> accuracy,
      Value<double?> speed,
      Value<double?> heading,
      required DateTime timestamp,
      required String syncStatus,
      Value<DateTime> createdAt,
    });
typedef $$LocationEventsTableTableUpdateCompanionBuilder =
    LocationEventsTableCompanion Function({
      Value<int> id,
      Value<String> eventId,
      Value<double> latitude,
      Value<double> longitude,
      Value<double?> accuracy,
      Value<double?> speed,
      Value<double?> heading,
      Value<DateTime> timestamp,
      Value<String> syncStatus,
      Value<DateTime> createdAt,
    });

class $$LocationEventsTableTableFilterComposer
    extends Composer<_$AppDatabase, $LocationEventsTableTable> {
  $$LocationEventsTableTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get eventId => $composableBuilder(
    column: $table.eventId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get latitude => $composableBuilder(
    column: $table.latitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get longitude => $composableBuilder(
    column: $table.longitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get accuracy => $composableBuilder(
    column: $table.accuracy,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get speed => $composableBuilder(
    column: $table.speed,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get heading => $composableBuilder(
    column: $table.heading,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get timestamp => $composableBuilder(
    column: $table.timestamp,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocationEventsTableTableOrderingComposer
    extends Composer<_$AppDatabase, $LocationEventsTableTable> {
  $$LocationEventsTableTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get eventId => $composableBuilder(
    column: $table.eventId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get latitude => $composableBuilder(
    column: $table.latitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get longitude => $composableBuilder(
    column: $table.longitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get accuracy => $composableBuilder(
    column: $table.accuracy,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get speed => $composableBuilder(
    column: $table.speed,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get heading => $composableBuilder(
    column: $table.heading,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get timestamp => $composableBuilder(
    column: $table.timestamp,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocationEventsTableTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocationEventsTableTable> {
  $$LocationEventsTableTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get eventId =>
      $composableBuilder(column: $table.eventId, builder: (column) => column);

  GeneratedColumn<double> get latitude =>
      $composableBuilder(column: $table.latitude, builder: (column) => column);

  GeneratedColumn<double> get longitude =>
      $composableBuilder(column: $table.longitude, builder: (column) => column);

  GeneratedColumn<double> get accuracy =>
      $composableBuilder(column: $table.accuracy, builder: (column) => column);

  GeneratedColumn<double> get speed =>
      $composableBuilder(column: $table.speed, builder: (column) => column);

  GeneratedColumn<double> get heading =>
      $composableBuilder(column: $table.heading, builder: (column) => column);

  GeneratedColumn<DateTime> get timestamp =>
      $composableBuilder(column: $table.timestamp, builder: (column) => column);

  GeneratedColumn<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$LocationEventsTableTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocationEventsTableTable,
          LocationEventsTableData,
          $$LocationEventsTableTableFilterComposer,
          $$LocationEventsTableTableOrderingComposer,
          $$LocationEventsTableTableAnnotationComposer,
          $$LocationEventsTableTableCreateCompanionBuilder,
          $$LocationEventsTableTableUpdateCompanionBuilder,
          (
            LocationEventsTableData,
            BaseReferences<
              _$AppDatabase,
              $LocationEventsTableTable,
              LocationEventsTableData
            >,
          ),
          LocationEventsTableData,
          PrefetchHooks Function()
        > {
  $$LocationEventsTableTableTableManager(
    _$AppDatabase db,
    $LocationEventsTableTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocationEventsTableTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocationEventsTableTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$LocationEventsTableTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> eventId = const Value.absent(),
                Value<double> latitude = const Value.absent(),
                Value<double> longitude = const Value.absent(),
                Value<double?> accuracy = const Value.absent(),
                Value<double?> speed = const Value.absent(),
                Value<double?> heading = const Value.absent(),
                Value<DateTime> timestamp = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
              }) => LocationEventsTableCompanion(
                id: id,
                eventId: eventId,
                latitude: latitude,
                longitude: longitude,
                accuracy: accuracy,
                speed: speed,
                heading: heading,
                timestamp: timestamp,
                syncStatus: syncStatus,
                createdAt: createdAt,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String eventId,
                required double latitude,
                required double longitude,
                Value<double?> accuracy = const Value.absent(),
                Value<double?> speed = const Value.absent(),
                Value<double?> heading = const Value.absent(),
                required DateTime timestamp,
                required String syncStatus,
                Value<DateTime> createdAt = const Value.absent(),
              }) => LocationEventsTableCompanion.insert(
                id: id,
                eventId: eventId,
                latitude: latitude,
                longitude: longitude,
                accuracy: accuracy,
                speed: speed,
                heading: heading,
                timestamp: timestamp,
                syncStatus: syncStatus,
                createdAt: createdAt,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocationEventsTableTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocationEventsTableTable,
      LocationEventsTableData,
      $$LocationEventsTableTableFilterComposer,
      $$LocationEventsTableTableOrderingComposer,
      $$LocationEventsTableTableAnnotationComposer,
      $$LocationEventsTableTableCreateCompanionBuilder,
      $$LocationEventsTableTableUpdateCompanionBuilder,
      (
        LocationEventsTableData,
        BaseReferences<
          _$AppDatabase,
          $LocationEventsTableTable,
          LocationEventsTableData
        >,
      ),
      LocationEventsTableData,
      PrefetchHooks Function()
    >;
typedef $$HeartbeatEventsTableTableCreateCompanionBuilder =
    HeartbeatEventsTableCompanion Function({
      Value<int> id,
      required String eventId,
      Value<int?> batteryLevel,
      Value<int> isCharging,
      required String connectivityType,
      required String gpsStatus,
      required String appVersion,
      required String deviceModel,
      required DateTime timestamp,
      required String syncStatus,
      Value<DateTime> createdAt,
    });
typedef $$HeartbeatEventsTableTableUpdateCompanionBuilder =
    HeartbeatEventsTableCompanion Function({
      Value<int> id,
      Value<String> eventId,
      Value<int?> batteryLevel,
      Value<int> isCharging,
      Value<String> connectivityType,
      Value<String> gpsStatus,
      Value<String> appVersion,
      Value<String> deviceModel,
      Value<DateTime> timestamp,
      Value<String> syncStatus,
      Value<DateTime> createdAt,
    });

class $$HeartbeatEventsTableTableFilterComposer
    extends Composer<_$AppDatabase, $HeartbeatEventsTableTable> {
  $$HeartbeatEventsTableTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get eventId => $composableBuilder(
    column: $table.eventId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get batteryLevel => $composableBuilder(
    column: $table.batteryLevel,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get isCharging => $composableBuilder(
    column: $table.isCharging,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get connectivityType => $composableBuilder(
    column: $table.connectivityType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get gpsStatus => $composableBuilder(
    column: $table.gpsStatus,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get appVersion => $composableBuilder(
    column: $table.appVersion,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get deviceModel => $composableBuilder(
    column: $table.deviceModel,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get timestamp => $composableBuilder(
    column: $table.timestamp,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$HeartbeatEventsTableTableOrderingComposer
    extends Composer<_$AppDatabase, $HeartbeatEventsTableTable> {
  $$HeartbeatEventsTableTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get eventId => $composableBuilder(
    column: $table.eventId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get batteryLevel => $composableBuilder(
    column: $table.batteryLevel,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get isCharging => $composableBuilder(
    column: $table.isCharging,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get connectivityType => $composableBuilder(
    column: $table.connectivityType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get gpsStatus => $composableBuilder(
    column: $table.gpsStatus,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get appVersion => $composableBuilder(
    column: $table.appVersion,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get deviceModel => $composableBuilder(
    column: $table.deviceModel,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get timestamp => $composableBuilder(
    column: $table.timestamp,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$HeartbeatEventsTableTableAnnotationComposer
    extends Composer<_$AppDatabase, $HeartbeatEventsTableTable> {
  $$HeartbeatEventsTableTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get eventId =>
      $composableBuilder(column: $table.eventId, builder: (column) => column);

  GeneratedColumn<int> get batteryLevel => $composableBuilder(
    column: $table.batteryLevel,
    builder: (column) => column,
  );

  GeneratedColumn<int> get isCharging => $composableBuilder(
    column: $table.isCharging,
    builder: (column) => column,
  );

  GeneratedColumn<String> get connectivityType => $composableBuilder(
    column: $table.connectivityType,
    builder: (column) => column,
  );

  GeneratedColumn<String> get gpsStatus =>
      $composableBuilder(column: $table.gpsStatus, builder: (column) => column);

  GeneratedColumn<String> get appVersion => $composableBuilder(
    column: $table.appVersion,
    builder: (column) => column,
  );

  GeneratedColumn<String> get deviceModel => $composableBuilder(
    column: $table.deviceModel,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get timestamp =>
      $composableBuilder(column: $table.timestamp, builder: (column) => column);

  GeneratedColumn<String> get syncStatus => $composableBuilder(
    column: $table.syncStatus,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$HeartbeatEventsTableTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $HeartbeatEventsTableTable,
          HeartbeatEventsTableData,
          $$HeartbeatEventsTableTableFilterComposer,
          $$HeartbeatEventsTableTableOrderingComposer,
          $$HeartbeatEventsTableTableAnnotationComposer,
          $$HeartbeatEventsTableTableCreateCompanionBuilder,
          $$HeartbeatEventsTableTableUpdateCompanionBuilder,
          (
            HeartbeatEventsTableData,
            BaseReferences<
              _$AppDatabase,
              $HeartbeatEventsTableTable,
              HeartbeatEventsTableData
            >,
          ),
          HeartbeatEventsTableData,
          PrefetchHooks Function()
        > {
  $$HeartbeatEventsTableTableTableManager(
    _$AppDatabase db,
    $HeartbeatEventsTableTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$HeartbeatEventsTableTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$HeartbeatEventsTableTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$HeartbeatEventsTableTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> eventId = const Value.absent(),
                Value<int?> batteryLevel = const Value.absent(),
                Value<int> isCharging = const Value.absent(),
                Value<String> connectivityType = const Value.absent(),
                Value<String> gpsStatus = const Value.absent(),
                Value<String> appVersion = const Value.absent(),
                Value<String> deviceModel = const Value.absent(),
                Value<DateTime> timestamp = const Value.absent(),
                Value<String> syncStatus = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
              }) => HeartbeatEventsTableCompanion(
                id: id,
                eventId: eventId,
                batteryLevel: batteryLevel,
                isCharging: isCharging,
                connectivityType: connectivityType,
                gpsStatus: gpsStatus,
                appVersion: appVersion,
                deviceModel: deviceModel,
                timestamp: timestamp,
                syncStatus: syncStatus,
                createdAt: createdAt,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String eventId,
                Value<int?> batteryLevel = const Value.absent(),
                Value<int> isCharging = const Value.absent(),
                required String connectivityType,
                required String gpsStatus,
                required String appVersion,
                required String deviceModel,
                required DateTime timestamp,
                required String syncStatus,
                Value<DateTime> createdAt = const Value.absent(),
              }) => HeartbeatEventsTableCompanion.insert(
                id: id,
                eventId: eventId,
                batteryLevel: batteryLevel,
                isCharging: isCharging,
                connectivityType: connectivityType,
                gpsStatus: gpsStatus,
                appVersion: appVersion,
                deviceModel: deviceModel,
                timestamp: timestamp,
                syncStatus: syncStatus,
                createdAt: createdAt,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$HeartbeatEventsTableTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $HeartbeatEventsTableTable,
      HeartbeatEventsTableData,
      $$HeartbeatEventsTableTableFilterComposer,
      $$HeartbeatEventsTableTableOrderingComposer,
      $$HeartbeatEventsTableTableAnnotationComposer,
      $$HeartbeatEventsTableTableCreateCompanionBuilder,
      $$HeartbeatEventsTableTableUpdateCompanionBuilder,
      (
        HeartbeatEventsTableData,
        BaseReferences<
          _$AppDatabase,
          $HeartbeatEventsTableTable,
          HeartbeatEventsTableData
        >,
      ),
      HeartbeatEventsTableData,
      PrefetchHooks Function()
    >;
typedef $$SyncMetadataTableTableCreateCompanionBuilder =
    SyncMetadataTableCompanion Function({
      Value<int> id,
      required String entityType,
      required String entityId,
      required DateTime lastSynced,
      required String status,
      Value<DateTime> updatedAt,
    });
typedef $$SyncMetadataTableTableUpdateCompanionBuilder =
    SyncMetadataTableCompanion Function({
      Value<int> id,
      Value<String> entityType,
      Value<String> entityId,
      Value<DateTime> lastSynced,
      Value<String> status,
      Value<DateTime> updatedAt,
    });

class $$SyncMetadataTableTableFilterComposer
    extends Composer<_$AppDatabase, $SyncMetadataTableTable> {
  $$SyncMetadataTableTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get entityType => $composableBuilder(
    column: $table.entityType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get entityId => $composableBuilder(
    column: $table.entityId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get lastSynced => $composableBuilder(
    column: $table.lastSynced,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$SyncMetadataTableTableOrderingComposer
    extends Composer<_$AppDatabase, $SyncMetadataTableTable> {
  $$SyncMetadataTableTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get entityType => $composableBuilder(
    column: $table.entityType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get entityId => $composableBuilder(
    column: $table.entityId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get lastSynced => $composableBuilder(
    column: $table.lastSynced,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$SyncMetadataTableTableAnnotationComposer
    extends Composer<_$AppDatabase, $SyncMetadataTableTable> {
  $$SyncMetadataTableTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get entityType => $composableBuilder(
    column: $table.entityType,
    builder: (column) => column,
  );

  GeneratedColumn<String> get entityId =>
      $composableBuilder(column: $table.entityId, builder: (column) => column);

  GeneratedColumn<DateTime> get lastSynced => $composableBuilder(
    column: $table.lastSynced,
    builder: (column) => column,
  );

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$SyncMetadataTableTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $SyncMetadataTableTable,
          SyncMetadataTableData,
          $$SyncMetadataTableTableFilterComposer,
          $$SyncMetadataTableTableOrderingComposer,
          $$SyncMetadataTableTableAnnotationComposer,
          $$SyncMetadataTableTableCreateCompanionBuilder,
          $$SyncMetadataTableTableUpdateCompanionBuilder,
          (
            SyncMetadataTableData,
            BaseReferences<
              _$AppDatabase,
              $SyncMetadataTableTable,
              SyncMetadataTableData
            >,
          ),
          SyncMetadataTableData,
          PrefetchHooks Function()
        > {
  $$SyncMetadataTableTableTableManager(
    _$AppDatabase db,
    $SyncMetadataTableTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SyncMetadataTableTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SyncMetadataTableTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SyncMetadataTableTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> entityType = const Value.absent(),
                Value<String> entityId = const Value.absent(),
                Value<DateTime> lastSynced = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
              }) => SyncMetadataTableCompanion(
                id: id,
                entityType: entityType,
                entityId: entityId,
                lastSynced: lastSynced,
                status: status,
                updatedAt: updatedAt,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String entityType,
                required String entityId,
                required DateTime lastSynced,
                required String status,
                Value<DateTime> updatedAt = const Value.absent(),
              }) => SyncMetadataTableCompanion.insert(
                id: id,
                entityType: entityType,
                entityId: entityId,
                lastSynced: lastSynced,
                status: status,
                updatedAt: updatedAt,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$SyncMetadataTableTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $SyncMetadataTableTable,
      SyncMetadataTableData,
      $$SyncMetadataTableTableFilterComposer,
      $$SyncMetadataTableTableOrderingComposer,
      $$SyncMetadataTableTableAnnotationComposer,
      $$SyncMetadataTableTableCreateCompanionBuilder,
      $$SyncMetadataTableTableUpdateCompanionBuilder,
      (
        SyncMetadataTableData,
        BaseReferences<
          _$AppDatabase,
          $SyncMetadataTableTable,
          SyncMetadataTableData
        >,
      ),
      SyncMetadataTableData,
      PrefetchHooks Function()
    >;
typedef $$LogEntriesTableTableCreateCompanionBuilder =
    LogEntriesTableCompanion Function({
      Value<int> id,
      required DateTime timestamp,
      required String level,
      required String category,
      Value<String?> eventId,
      Value<String?> tripId,
      required String message,
      Value<String?> metadataJson,
    });
typedef $$LogEntriesTableTableUpdateCompanionBuilder =
    LogEntriesTableCompanion Function({
      Value<int> id,
      Value<DateTime> timestamp,
      Value<String> level,
      Value<String> category,
      Value<String?> eventId,
      Value<String?> tripId,
      Value<String> message,
      Value<String?> metadataJson,
    });

class $$LogEntriesTableTableFilterComposer
    extends Composer<_$AppDatabase, $LogEntriesTableTable> {
  $$LogEntriesTableTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get timestamp => $composableBuilder(
    column: $table.timestamp,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get level => $composableBuilder(
    column: $table.level,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get category => $composableBuilder(
    column: $table.category,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get eventId => $composableBuilder(
    column: $table.eventId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get tripId => $composableBuilder(
    column: $table.tripId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get message => $composableBuilder(
    column: $table.message,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get metadataJson => $composableBuilder(
    column: $table.metadataJson,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LogEntriesTableTableOrderingComposer
    extends Composer<_$AppDatabase, $LogEntriesTableTable> {
  $$LogEntriesTableTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get timestamp => $composableBuilder(
    column: $table.timestamp,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get level => $composableBuilder(
    column: $table.level,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get category => $composableBuilder(
    column: $table.category,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get eventId => $composableBuilder(
    column: $table.eventId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get tripId => $composableBuilder(
    column: $table.tripId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get message => $composableBuilder(
    column: $table.message,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get metadataJson => $composableBuilder(
    column: $table.metadataJson,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LogEntriesTableTableAnnotationComposer
    extends Composer<_$AppDatabase, $LogEntriesTableTable> {
  $$LogEntriesTableTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<DateTime> get timestamp =>
      $composableBuilder(column: $table.timestamp, builder: (column) => column);

  GeneratedColumn<String> get level =>
      $composableBuilder(column: $table.level, builder: (column) => column);

  GeneratedColumn<String> get category =>
      $composableBuilder(column: $table.category, builder: (column) => column);

  GeneratedColumn<String> get eventId =>
      $composableBuilder(column: $table.eventId, builder: (column) => column);

  GeneratedColumn<String> get tripId =>
      $composableBuilder(column: $table.tripId, builder: (column) => column);

  GeneratedColumn<String> get message =>
      $composableBuilder(column: $table.message, builder: (column) => column);

  GeneratedColumn<String> get metadataJson => $composableBuilder(
    column: $table.metadataJson,
    builder: (column) => column,
  );
}

class $$LogEntriesTableTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LogEntriesTableTable,
          LogEntriesTableData,
          $$LogEntriesTableTableFilterComposer,
          $$LogEntriesTableTableOrderingComposer,
          $$LogEntriesTableTableAnnotationComposer,
          $$LogEntriesTableTableCreateCompanionBuilder,
          $$LogEntriesTableTableUpdateCompanionBuilder,
          (
            LogEntriesTableData,
            BaseReferences<
              _$AppDatabase,
              $LogEntriesTableTable,
              LogEntriesTableData
            >,
          ),
          LogEntriesTableData,
          PrefetchHooks Function()
        > {
  $$LogEntriesTableTableTableManager(
    _$AppDatabase db,
    $LogEntriesTableTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LogEntriesTableTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LogEntriesTableTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LogEntriesTableTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<DateTime> timestamp = const Value.absent(),
                Value<String> level = const Value.absent(),
                Value<String> category = const Value.absent(),
                Value<String?> eventId = const Value.absent(),
                Value<String?> tripId = const Value.absent(),
                Value<String> message = const Value.absent(),
                Value<String?> metadataJson = const Value.absent(),
              }) => LogEntriesTableCompanion(
                id: id,
                timestamp: timestamp,
                level: level,
                category: category,
                eventId: eventId,
                tripId: tripId,
                message: message,
                metadataJson: metadataJson,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required DateTime timestamp,
                required String level,
                required String category,
                Value<String?> eventId = const Value.absent(),
                Value<String?> tripId = const Value.absent(),
                required String message,
                Value<String?> metadataJson = const Value.absent(),
              }) => LogEntriesTableCompanion.insert(
                id: id,
                timestamp: timestamp,
                level: level,
                category: category,
                eventId: eventId,
                tripId: tripId,
                message: message,
                metadataJson: metadataJson,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LogEntriesTableTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LogEntriesTableTable,
      LogEntriesTableData,
      $$LogEntriesTableTableFilterComposer,
      $$LogEntriesTableTableOrderingComposer,
      $$LogEntriesTableTableAnnotationComposer,
      $$LogEntriesTableTableCreateCompanionBuilder,
      $$LogEntriesTableTableUpdateCompanionBuilder,
      (
        LogEntriesTableData,
        BaseReferences<
          _$AppDatabase,
          $LogEntriesTableTable,
          LogEntriesTableData
        >,
      ),
      LogEntriesTableData,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$DeviceStateTableTableTableManager get deviceStateTable =>
      $$DeviceStateTableTableTableManager(_db, _db.deviceStateTable);
  $$MqttQueueTableTableTableManager get mqttQueueTable =>
      $$MqttQueueTableTableTableManager(_db, _db.mqttQueueTable);
  $$ScanEventsTableTableTableManager get scanEventsTable =>
      $$ScanEventsTableTableTableManager(_db, _db.scanEventsTable);
  $$LocationEventsTableTableTableManager get locationEventsTable =>
      $$LocationEventsTableTableTableManager(_db, _db.locationEventsTable);
  $$HeartbeatEventsTableTableTableManager get heartbeatEventsTable =>
      $$HeartbeatEventsTableTableTableManager(_db, _db.heartbeatEventsTable);
  $$SyncMetadataTableTableTableManager get syncMetadataTable =>
      $$SyncMetadataTableTableTableManager(_db, _db.syncMetadataTable);
  $$LogEntriesTableTableTableManager get logEntriesTable =>
      $$LogEntriesTableTableTableManager(_db, _db.logEntriesTable);
}
