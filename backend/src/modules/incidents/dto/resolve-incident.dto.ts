import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveIncidentDto {
  @ApiProperty({ example: 'Tire was replaced and bus is operational' })
  @IsString()
  @MinLength(5)
  resolution!: string;
}
