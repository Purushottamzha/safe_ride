import { IsString, IsOptional, IsNumber, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateStopDto {
  @ApiProperty({ example: 'Baneshwor Stop' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Baneshwor, Kathmandu' })
  @IsString()
  address!: string;

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

  @ApiProperty({ example: 'uuid-of-school' })
  @IsUUID()
  schoolId!: string;
}
