import { IsString, IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TripType } from '@prisma/client';

export class AttendanceReportDto {
  @ApiProperty({ example: 'uuid-of-school' })
  @IsUUID()
  schoolId!: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  fromDate!: string;

  @ApiProperty({ example: '2026-01-31' })
  @IsDateString()
  toDate!: string;

  @ApiPropertyOptional({ enum: TripType, example: 'MORNING' })
  @IsOptional()
  @IsEnum(TripType)
  type?: TripType;

  @ApiPropertyOptional({ example: '5' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional({ example: 'json' })
  @IsOptional()
  @IsString()
  format?: 'json' | 'csv' | 'excel' | 'pdf';
}
