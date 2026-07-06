import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDeviceDto {
  @ApiProperty({ example: 'gps-tracker-001' })
  @IsString()
  deviceId!: string;

  @ApiProperty({ example: 'GPS_TRACKER' })
  @IsString()
  type!: string;

  @ApiProperty({ example: 'Bus GPS Tracker' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'TK-108' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 'v2.1.0' })
  @IsOptional()
  @IsString()
  firmwareVersion?: string;
}
