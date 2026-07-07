import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceType } from '@prisma/client';

export class RegisterDeviceDto {
  @ApiProperty({ example: 'Gate-1 Webcam' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'WEBCAM_DEMO', enum: ['WEBCAM_DEMO', 'ESP32_CAM', 'ESP32_GPS'] })
  @IsEnum(DeviceType)
  type!: DeviceType;

  @ApiPropertyOptional({ example: 'uuid-of-bus' })
  @IsOptional()
  @IsString()
  busId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-school' })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional({ example: 'v1.0.0' })
  @IsOptional()
  @IsString()
  firmwareVersion?: string;
}
