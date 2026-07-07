import { IsString, IsOptional, IsUUID, IsNumber, IsInt, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRouteDto {
  @ApiProperty({ example: 'Downtown Route' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'RTE-001' })
  @IsString()
  code!: string;

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

  @ApiProperty({ example: 'uuid-of-school' })
  @IsUUID()
  schoolId!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['uuid-of-stop-1', 'uuid-of-stop-2'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  stopIds?: string[];
}
