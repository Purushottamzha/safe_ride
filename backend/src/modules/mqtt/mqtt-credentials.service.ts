import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { PrismaService } from '../../database/prisma.service';

interface DeviceEntry {
  deviceId: string;
  schoolId: string;
  busId: string;
  passwordHash: string;
}

interface UserEntry {
  username: string;
  passwordHash: string;
}

interface CredentialsStore {
  users: UserEntry[];
  devices: DeviceEntry[];
}

@Injectable()
export class MqttCredentialsService {
  private readonly logger = new Logger(MqttCredentialsService.name);
  private readonly credentialsPath: string;
  private store: CredentialsStore;

  constructor(private readonly prisma: PrismaService) {
    this.credentialsPath = process.env.MQTT_CREDENTIALS_PATH || '/mosquitto-auth/credentials.json';
    this.store = { users: [], devices: [] };
    this.loadStore();
  }

  private loadStore(): void {
    try {
      if (fs.existsSync(this.credentialsPath)) {
        const raw = fs.readFileSync(this.credentialsPath, 'utf-8');
        this.store = JSON.parse(raw);
        this.logger.log(`Loaded credentials store: ${this.store.devices.length} devices, ${this.store.users.length} users`);
      } else {
        this.logger.warn(`Credentials file not found at ${this.credentialsPath} — starting empty`);
        this.store = { users: [], devices: [] };
      }
    } catch (err) {
      this.logger.error(`Failed to load credentials store: ${(err as Error).message}`);
    }
  }

  private saveStore(): void {
    try {
      const dir = path.dirname(this.credentialsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Atomic write: write to temp file, then rename (inotify only fires on the final rename)
      const tmpPath = `${this.credentialsPath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(this.store, null, 2), 'utf-8');
      fs.renameSync(tmpPath, this.credentialsPath);
      this.logger.debug('Credentials store saved atomically');
    } catch (err) {
      this.logger.error(`Failed to save credentials store: ${(err as Error).message}`);
    }
  }

  private hashPassword(username: string, password: string): string {
    const tmpFile = path.join(
      process.env.TMPDIR || '/tmp',
      `_mqtt_hash_${crypto.randomBytes(4).toString('hex')}`,
    );
    try {
      execSync(
        `mosquitto_passwd -b "${tmpFile}" "${username}" "${password}"`,
        { stdio: 'pipe', timeout: 5000 },
      );
      const content = fs.readFileSync(tmpFile, 'utf-8');
      const line = content.split('\n').find((l) => l.startsWith(`${username}:`));
      if (!line) {
        throw new Error(`mosquitto_passwd did not produce a hash for ${username}`);
      }
      return line.split(':')[1];
    } finally {
      try { fs.unlinkSync(tmpFile); } catch { /* ignore cleanup failure */ }
    }
  }

  async provisionDevice(deviceId: string): Promise<{ username: string; password: string }> {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
      include: { bus: { select: { id: true } }, school: { select: { id: true } } },
    });

    if (!device) {
      throw new NotFoundException(`Device ${deviceId} not found`);
    }

    if (!device.schoolId || !device.busId) {
      throw new ConflictException(
        `Device ${deviceId} must be assigned to a school and bus before provisioning MQTT credentials`,
      );
    }

    if (this.store.devices.some((d) => d.deviceId === deviceId)) {
      throw new ConflictException(`Device ${deviceId} already has MQTT credentials — revoke first or use rotate`);
    }

    const password = crypto.randomBytes(24).toString('hex');
    const username = `device_${deviceId}`;

    // Hash immediately — only the hash is persisted. Plaintext returned once.
    const passwordHash = this.hashPassword(username, password);

    this.store.devices.push({
      deviceId,
      schoolId: device.schoolId,
      busId: device.busId,
      passwordHash,
    });

    this.saveStore();

    this.logger.log(`Provisioned MQTT credentials for device ${deviceId}`);

    return { username, password };
  }

  async revokeDevice(deviceId: string): Promise<void> {
    const index = this.store.devices.findIndex((d) => d.deviceId === deviceId);
    if (index === -1) {
      throw new NotFoundException(`Device ${deviceId} has no MQTT credentials`);
    }

    this.store.devices.splice(index, 1);
    this.saveStore();

    this.logger.log(`Revoked MQTT credentials for device ${deviceId}`);
  }

  async rotateDevice(deviceId: string): Promise<{ username: string; password: string }> {
    // Note: this does revoke-then-provision, leaving a brief window with no
    // valid credential (~5s until inotify reload). Acceptable for pilot with
    // 1-2 devices. For multi-bus scale, switch to provision-new-then-revoke-old
    // with a short overlap period.
    await this.revokeDevice(deviceId);
    return this.provisionDevice(deviceId);
  }

  listDevices(): Array<{ deviceId: string; schoolId: string; busId: string; hasCredentials: boolean }> {
    return this.store.devices.map((d) => ({
      deviceId: d.deviceId,
      schoolId: d.schoolId,
      busId: d.busId,
      hasCredentials: true,
    }));
  }

  hasDevice(deviceId: string): boolean {
    return this.store.devices.some((d) => d.deviceId === deviceId);
  }
}
