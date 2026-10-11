import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TrackingGateway } from './tracking.gateway';
import { TrackingService } from './tracking.service';
import { TrackingController } from './tracking.controller';

@Module({
  imports: [JwtModule],
  controllers: [TrackingController],
  providers: [TrackingGateway, TrackingService],
  exports: [TrackingService, TrackingGateway],
})
export class TrackingModule {}
