import { IsString, IsOptional, IsUUID, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ScanType } from '@prisma/client';

export class ScanQrDto {
  @ApiProperty({ example: 'student-qr-token-value' })
  @IsString()
  qrToken!: string;

  @ApiProperty({ example: 'uuid-of-trip' })
  @IsUUID()
  tripId!: string;

  @ApiProperty({ enum: ScanType, example: 'BOARD_IN' })
  @IsEnum(ScanType)
  scanType!: ScanType;

  @ApiPropertyOptional({ example: 27.7172 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 85.324 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: '2026-01-15T08:00:00Z' })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}
