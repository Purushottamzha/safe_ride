import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteTripDto {
  @ApiPropertyOptional({ example: 'Trip completed successfully' })
  @IsOptional()
  @IsString()
  notes?: string;
}
