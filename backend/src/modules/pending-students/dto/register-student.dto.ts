import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterStudentDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
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

  @ApiProperty({ example: '123 Main St, Kathmandu' })
  @IsString()
  address!: string;

  @ApiPropertyOptional({ example: '9841234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg' })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @ApiProperty({ example: 'uuid-of-school' })
  @IsString()
  schoolId!: string;
}
