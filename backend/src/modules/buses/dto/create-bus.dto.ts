import { IsString, IsOptional, IsInt, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBusDto {
  @ApiProperty({ example: 'BA 1 KHA 1234' })
  @IsString()
  plateNumber!: string;

  @ApiProperty({ example: 'BUS-001' })
  @IsString()
  busNumber!: string;

  @ApiPropertyOptional({ example: 'Toyota Coaster' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ example: 40 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  capacity!: number;

  @ApiPropertyOptional({ example: 2022 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ example: 'White' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ example: 'uuid-of-school' })
  @IsUUID()
  schoolId!: string;
}
