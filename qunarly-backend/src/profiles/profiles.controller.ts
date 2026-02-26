import { Body, Controller, Get, Post, Put, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';

@Controller('profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Get('me')
  async me(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.profilesService.getByUserId(user.id);
  }

  @Put('me')
  async update(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const user = req.user as { id: string };
    return this.profilesService.upsertProfile(user.id, dto);
  }

  @Post('me/avatar')
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
  async uploadAvatar(@Req() req: Request) {
    const user = req.user as { id: string };
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) {
      return this.profilesService.getByUserId(user.id);
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.profilesService.uploadAvatar(user.id, file, baseUrl);
  }
}
