import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSchoolDto {
  @ApiProperty({ example: 'SafeRide High School' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'SRHS001' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Kathmandu, Nepal' })
  @IsString()
  address!: string;

  @ApiProperty({ example: '+977-1-4XXXXXX' })
  @IsString()
  phone!: string;

  @ApiProperty({ example: 'admin@srhs.edu.np' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'https://srhs.edu.np' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ example: 'Asia/Kathmandu' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
