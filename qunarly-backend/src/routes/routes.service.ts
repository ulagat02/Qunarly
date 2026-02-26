import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateRouteTemplateDto } from './dto/create-route-template.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRouteTemplateDto) {
    try {
      return await this.prisma.routeTemplate.create({
        data: dto,
        include: { fromHub: true, toHub: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return this.prisma.routeTemplate.findUnique({
          where: { fromHubId_toHubId: { fromHubId: dto.fromHubId, toHubId: dto.toHubId } },
          include: { fromHub: true, toHub: true },
        });
      }
      throw error;
    }
  }

  async listFromHub(fromHubId: string) {
    return this.prisma.routeTemplate.findMany({
      where: { fromHubId, isActive: true },
      include: { toHub: true },
    });
  }
}
