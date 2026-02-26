import { BadRequestException, Controller, Get, Logger, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RegionsService } from './regions.service';

@ApiTags('Districts')
@Controller('districts')
export class DistrictsController {
  private readonly logger = new Logger(DistrictsController.name);
  constructor(private regionsService: RegionsService) {}

  @Get()
  async list(@Query('regionId') regionId?: string) {
    if (!regionId) {
      throw new BadRequestException('regionId is required');
    }
    this.logger.log(`list: regionId=${regionId}`);
    return this.regionsService.listDistricts(regionId);
  }
}
