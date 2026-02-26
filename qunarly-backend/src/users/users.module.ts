import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PublicUsersController } from './public-users.controller';
import { PublicRateLimitGuard } from '../common/public-rate-limit.guard';

@Module({
  providers: [UsersService, PublicRateLimitGuard],
  controllers: [UsersController, PublicUsersController],
  exports: [UsersService],
})
export class UsersModule {}
