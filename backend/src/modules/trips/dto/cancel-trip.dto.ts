import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelTripDto {
  @ApiProperty({ example: 'Bus had a mechanical issue' })
  @IsString()
  @MinLength(5)
  reason!: string;
}
