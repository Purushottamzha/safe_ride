import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SimulatorController } from './simulator.controller';
import { SimulatorService } from './simulator.service';

@Module({
  imports: [AuthModule],
  controllers: [SimulatorController],
  providers: [SimulatorService],
  exports: [SimulatorService],
})
export class SimulatorModule {}
