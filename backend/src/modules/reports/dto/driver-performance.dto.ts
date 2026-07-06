import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DriverPerformanceDto {
  @ApiProperty({ example: 'uuid-of-school' })
  @IsUUID()
  schoolId!: string;

  @ApiPropertyOptional({ example: 'uuid-of-driver' })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  fromDate!: string;

  @ApiProperty({ example: '2026-01-31' })
  @IsDateString()
  toDate!: string;

  @ApiPropertyOptional({ example: 'json' })
  @IsOptional()
  @IsString()
  format?: string;
}
