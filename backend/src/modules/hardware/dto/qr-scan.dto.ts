import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QrScanDto {
  @ApiProperty({ example: 'webcam-demo-001' })
  @IsString()
  deviceId!: string;

  @ApiPropertyOptional({ example: 'uuid-of-bus' })
  @IsOptional()
  @IsString()
  busId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-trip' })
  @IsOptional()
  @IsString()
  tripId?: string;

  @ApiProperty({ example: 'abc123...' })
  @IsString()
  qrToken!: string;

  @ApiProperty({ example: '2026-07-07T08:30:00Z' })
  @IsOptional()
  @IsString()
  capturedAt?: string;

  @ApiPropertyOptional({ example: 'base64-encoded-image' })
  @IsOptional()
  @IsString()
  imageBase64?: string;
}
