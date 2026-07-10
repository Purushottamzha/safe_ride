import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignIncidentDto {
  @ApiProperty({ example: 'uuid-of-user' })
  @IsUUID()
  assignedToId!: string;
}
