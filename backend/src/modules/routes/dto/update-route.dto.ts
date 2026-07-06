import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsInt,
  IsArray,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateRouteDto {
  @ApiPropertyOptional({ example: 'Downtown Route' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'RTE-001' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'TO_SCHOOL' })
  @IsOptional()
  @IsString()
  direction?: string;

  @ApiPropertyOptional({ example: 12.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distance?: number;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({ example: 'uuid-of-school' })
  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['uuid-of-stop-1', 'uuid-of-stop-2'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  stopIds?: string[];
}
