import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class StudentAssignmentDto {
  @ApiProperty({ example: 'uuid-of-student' })
  @IsUUID()
  studentId!: string;

  @ApiPropertyOptional({ example: 'uuid-of-stop' })
  @IsOptional()
  @IsUUID()
  stopId?: string;
}

export class CreateAssignmentDto {
  @ApiPropertyOptional({ example: 'Morning Run A' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'uuid-of-school' })
  @IsUUID()
  schoolId!: string;

  @ApiProperty({ example: 'uuid-of-route' })
  @IsUUID()
  routeId!: string;

  @ApiProperty({
    type: [String],
    example: ['uuid-of-driver-1', 'uuid-of-driver-2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  driverIds!: string[];

  @ApiProperty({
    type: [String],
    example: ['uuid-of-bus-1', 'uuid-of-bus-2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  busIds!: string[];

  @ApiProperty({
    type: [StudentAssignmentDto],
    example: [{ studentId: 'uuid', stopId: 'uuid' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => StudentAssignmentDto)
  studentAssignments!: StudentAssignmentDto[];
}
