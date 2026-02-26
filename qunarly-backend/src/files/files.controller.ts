import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFileDto } from './dto/create-file.dto';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { FileEntityType } from '@prisma/client';

@Controller('files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateFileDto) {
    const user = req.user as { id: string };
    return this.filesService.create(user.id, dto);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req: Express.Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
          const uploadPath = path.join(process.cwd(), 'uploads');
          fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          const ext = path.extname(file.originalname);
          const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async upload(
    @Req() req: Request,
    @Body('entityType') entityType?: FileEntityType,
  ) {
    const user = req.user as { id: string };
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.filesService.createUploadedFile(user.id, file, entityType, undefined, baseUrl);
  }
}
