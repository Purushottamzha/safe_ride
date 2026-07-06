import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDriverDto {
  @ApiProperty({ example: 'uuid-of-user' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: 'DL-12345678' })
  @IsString()
  licenseNumber!: string;

  @ApiProperty({ example: '2028-12-31' })
  @IsDateString()
  licenseExpiry!: string;

  @ApiPropertyOptional({ example: '+977-9800000000' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ example: 'No known medical issues' })
  @IsOptional()
  @IsString()
  medicalNotes?: string;

  @ApiProperty({ example: 'uuid-of-school' })
  @IsUUID()
  schoolId!: string;
}
