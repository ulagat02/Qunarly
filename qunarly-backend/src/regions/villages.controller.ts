import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RegionsService } from './regions.service';

@ApiTags('Villages')
@Controller('villages')
export class VillagesController {
  constructor(private regionsService: RegionsService) {}

  @Get()
  async listVillages(
    @Query('districtId') districtId?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    if (!districtId) {
      throw new BadRequestException('districtId is required');
    }
    const take = limit ? Math.min(Number(limit), 200) : 50;
    if (!Number.isFinite(take) || take <= 0) {
      throw new BadRequestException('limit is invalid');
    }
    return this.regionsService.listSettlements(districtId, q, take);
  }
}
