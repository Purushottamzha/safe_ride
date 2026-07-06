import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class StudentRelationDto {
  @ApiProperty({ example: 'uuid-of-student' })
  @IsUUID()
  studentId!: string;

  @ApiProperty({ example: 'FATHER' })
  @IsString()
  relation!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateParentDto {
  @ApiProperty({ example: 'uuid-of-user' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  emergencyContact?: boolean;

  @ApiProperty({
    type: [StudentRelationDto],
    example: [{ studentId: 'uuid', relation: 'FATHER', isPrimary: true }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => StudentRelationDto)
  students!: StudentRelationDto[];
}
