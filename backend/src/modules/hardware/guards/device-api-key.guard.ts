import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class DeviceApiKeyGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-device-api-key'];
    const expectedKey = this.configService.get<string>('hardware.deviceApiKey');

    if (!expectedKey) {
      throw new UnauthorizedException('Device API key not configured on server');
    }

    if (!apiKey) {
      throw new UnauthorizedException('Missing x-device-api-key header');
    }

    if (apiKey !== expectedKey) {
      throw new UnauthorizedException('Invalid device API key');
    }

    request.deviceInfo = {
      deviceId: request.headers['x-device-id'] || 'unknown',
      deviceType: request.headers['x-device-type'] || 'unknown',
    };

    return true;
  }
}
