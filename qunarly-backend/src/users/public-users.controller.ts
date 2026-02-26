import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { PublicRateLimitGuard } from '../common/public-rate-limit.guard';

@Controller('users')
export class PublicUsersController {
  constructor(private usersService: UsersService) {}

  @Get(':id/public')
  @UseGuards(PublicRateLimitGuard)
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
