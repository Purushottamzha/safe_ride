import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DriverSafetyService } from './driver-safety.service';

@Controller('driver-safety')
@UseGuards(JwtAuthGuard)
export class DriverSafetyController {
  constructor(private service: DriverSafetyService) {}

  @Get('scores')
  async getAllScores(@Query('schoolId') schoolId?: string) {
    return this.service.getAllScores(schoolId);
  }

  @Get(':driverId')
  async getDriverScore(@Param('driverId') driverId: string) {
    return this.service.getScore(driverId);
  }

  @Get(':driverId/events')
  async getDriverEvents(@Param('driverId') driverId: string, @Query('limit') limit?: string) {
    return this.service.getEvents(driverId, limit ? parseInt(limit) : 50);
  }
}
