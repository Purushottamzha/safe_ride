import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StartTripDto {
  @ApiPropertyOptional({ example: 'Trip started on time' })
  @IsOptional()
  @IsString()
  notes?: string;
}
