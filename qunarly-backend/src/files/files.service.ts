import { Injectable } from '@nestjs/common';
import { FileEntityType, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { CreateFileDto } from './dto/create-file.dto';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateFileDto) {
    return this.prisma.file.create({
      data: {
        ownerId,
        type: dto.type,
        url: dto.url,
        metaJson: dto.metaJson
          ? (dto.metaJson as Prisma.InputJsonValue)
          : undefined,
      },
    });
  }

  async createUploadedFile(
    ownerId: string,
    file: Express.Multer.File,
    entityType?: FileEntityType,
    entityId?: string,
    baseUrl?: string,
  ) {
    const resolvedBaseUrl =
      baseUrl || process.env.APP_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
    const url = `${resolvedBaseUrl}/uploads/${path.basename(file.path)}`;
    return this.prisma.file.create({
      data: {
        ownerId,
        type: file.mimetype,
        url,
        entityType,
        entityId,
        metaJson: {
          originalName: file.originalname,
          size: file.size,
        } as Prisma.InputJsonValue,
      },
    });
  }
}
