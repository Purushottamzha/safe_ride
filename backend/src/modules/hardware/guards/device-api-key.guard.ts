import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class DeviceApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-device-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('Missing x-device-api-key header');
    }

    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const device = await this.prisma.device.findFirst({
      where: { apiKeyHash: hash, status: 'ACTIVE' },
    });

    if (!device) {
      throw new UnauthorizedException('Invalid or inactive device API key');
    }

    await this.prisma.device.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    });

    request.deviceInfo = {
      deviceId: device.id,
      deviceName: device.name,
      deviceType: device.type,
    };

    return true;
  }
}
