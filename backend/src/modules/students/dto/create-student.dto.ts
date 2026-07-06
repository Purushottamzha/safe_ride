import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ example: 'Sita' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Rai' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: '2012-05-15' })
  @IsDateString()
  dateOfBirth!: string;

  @ApiProperty({ example: '5' })
  @IsString()
  grade!: string;

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiProperty({ example: 'Kathmandu' })
  @IsString()
  address!: string;

  @ApiPropertyOptional({ example: '+977-9812345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'uuid-of-school' })
  @IsUUID()
  schoolId!: string;

  @ApiPropertyOptional({ example: 'Has allergy to peanuts' })
  @IsOptional()
  @IsString()
  emergencyNotes?: string;
}
