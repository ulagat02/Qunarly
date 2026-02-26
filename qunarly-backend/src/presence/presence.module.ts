import { Module } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { PresenceController } from './presence.controller';
import { HubsModule } from '../hubs/hubs.module';

@Module({
  imports: [HubsModule],
  providers: [PresenceService],
  controllers: [PresenceController],
})
export class PresenceModule {}
