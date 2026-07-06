import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, Min, Max, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IncidentSeverity } from '@prisma/client';

export class CreateIncidentDto {
  @ApiProperty({ example: 'Tire burst' })
  @IsString()
  @MinLength(3)
  title!: string;

  @ApiProperty({ example: 'Front left tire burst during the trip.' })
  @IsString()
  @MinLength(10)
  description!: string;

  @ApiProperty({ enum: IncidentSeverity, example: 'HIGH' })
  @IsEnum(IncidentSeverity)
  severity!: IncidentSeverity;

  @ApiPropertyOptional({ example: 27.7172 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 85.324 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: 'Kathmandu, Nepal' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'uuid-of-trip' })
  @IsOptional()
  @IsUUID()
  tripId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-student' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-bus' })
  @IsOptional()
  @IsUUID()
  busId?: string;
}
