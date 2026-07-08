import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);
  private readonly GPS_RETENTION_DAYS = 30;
  private readonly SOFT_DELETE_GRACE_DAYS = 7;
  private readonly BATCH_SIZE = 1000;

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeOldLocationData(): Promise<void> {
    this.logger.log('Starting retention purge job...');
    await this.softDeleteExpiredRows();
    await this.hardDeleteStaleSoftDeletes();
    this.logger.log('Retention purge job completed.');
  }

  async runManually(): Promise<void> {
    this.logger.log('Running retention purge manually...');
    await this.softDeleteExpiredRows();
    await this.hardDeleteStaleSoftDeletes();
    this.logger.log('Manual retention purge completed.');
  }

  private async softDeleteExpiredRows(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.GPS_RETENTION_DAYS);

    let totalDeleted = 0;
    let batch: number;

    do {
      batch = await this.prisma.rawLocation.updateMany({
        where: {
          receivedAt: { lt: cutoff },
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
        take: this.BATCH_SIZE,
      });

      totalDeleted += batch.count;
      this.logger.debug(`Soft-deleted ${batch.count} RawLocation rows (running total: ${totalDeleted})`);
    } while (batch.count === this.BATCH_SIZE);

    this.logger.log(`Soft-deleted ${totalDeleted} RawLocation rows older than ${this.GPS_RETENTION_DAYS} days`);
  }

  private async hardDeleteStaleSoftDeletes(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.SOFT_DELETE_GRACE_DAYS);

    let totalDeleted = 0;
    let batch: { count: number };

    do {
      batch = await this.prisma.rawLocation.deleteMany({
        where: {
          deletedAt: { lt: cutoff },
        },
        take: this.BATCH_SIZE,
      });

      totalDeleted += batch.count;
      this.logger.debug(`Hard-deleted ${batch.count} stale RawLocation rows (running total: ${totalDeleted})`);
    } while (batch.count === this.BATCH_SIZE);

    this.logger.log(`Hard-deleted ${totalDeleted} stale RawLocation rows past grace period`);
  }
}
