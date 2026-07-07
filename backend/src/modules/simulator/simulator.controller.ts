import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SimulatorService } from './simulator.service';

@Controller('simulator')
@UseGuards(JwtAuthGuard)
export class SimulatorController {
  constructor(private service: SimulatorService) {}

  @Post('start')
  async start(@Body() body?: { speed?: number }) {
    return this.service.start(body?.speed ?? 1);
  }

  @Post('stop')
  async stop() {
    return this.service.stop();
  }

  @Post('speed')
  async setSpeed(@Body() body: { speed: number }) {
    return this.service.setSpeed(body.speed);
  }

  @Get('status')
  async status() {
    return this.service.getStatus();
  }
}
