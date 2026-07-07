import { Module } from '@nestjs/common';
import { PendingStudentsController } from './pending-students.controller';
import { PendingStudentsService } from './pending-students.service';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [PendingStudentsController],
  providers: [PendingStudentsService],
  exports: [PendingStudentsService],
})
export class PendingStudentsModule {}
