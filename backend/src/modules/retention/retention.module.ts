import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { RetentionService } from './retention.service';

@Module({
  imports: [PrismaModule],
  providers: [RetentionService],
  exports: [RetentionService],
})
export class RetentionModule {}
