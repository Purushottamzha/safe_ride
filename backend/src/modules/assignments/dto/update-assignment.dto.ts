import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class StudentAssignmentDto {
  @ApiPropertyOptional({ example: 'uuid-of-student' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-stop' })
  @IsOptional()
  @IsUUID()
  stopId?: string;
}

export class UpdateAssignmentDto {
  @ApiPropertyOptional({ example: 'Morning Run A' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'uuid-of-school' })
  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-route' })
  @IsOptional()
  @IsUUID()
  routeId?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['uuid-of-driver-1'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  driverIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['uuid-of-bus-1'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  busIds?: string[];

  @ApiPropertyOptional({
    type: [StudentAssignmentDto],
    example: [{ studentId: 'uuid', stopId: 'uuid' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentAssignmentDto)
  studentAssignments?: StudentAssignmentDto[];
}
