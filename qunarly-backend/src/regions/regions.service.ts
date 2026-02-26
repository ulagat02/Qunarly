import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateRegionDto } from './dto/create-region.dto';

@Injectable()
export class RegionsService {
  private readonly logger = new Logger(RegionsService.name);
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.region.findMany({
      where: { parentId: null },
      include: { children: true },
      orderBy: { name: 'asc' },
    });
  }

  async listDistricts(regionId: string) {
    const districts = await this.prisma.district.findMany({
      where: { regionId },
      orderBy: { name: 'asc' },
    });
    this.logger.log(`listDistricts: regionId=${regionId} count=${districts.length}`);
    return districts;
  }

  async listSettlements(districtId: string, query?: string, take = 50) {
    return this.prisma.settlement.findMany({
      where: {
        districtId,
        ...(query
          ? {
              name: {
                contains: query.trim(),
                mode: 'insensitive',
              },
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      take,
      select: { id: true, name: true },
    });
  }


  async create(dto: CreateRegionDto) {
    return this.prisma.region.create({ data: dto });
  }
}
