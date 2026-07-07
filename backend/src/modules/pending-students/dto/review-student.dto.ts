import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewStudentDto {
  @ApiPropertyOptional({ example: 'Looks good, approved' })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
