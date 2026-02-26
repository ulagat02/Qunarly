import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PresenceService } from './presence.service';

@ApiTags('Presence')
@Controller('presence')
export class PresenceController {
  constructor(private presenceService: PresenceService) {}

  @Get('resolve-hub')
  async resolveHub(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.presenceService.resolveHub(Number(lat), Number(lng));
  }
}
