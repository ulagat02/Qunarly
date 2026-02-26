import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UserRole } from '@prisma/client';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.BUYER, UserRole.WHOLESALE_BUYER)
  async create(@Req() req: Request, @Body() dto: CreateOrderDto) {
    const userId = (req.user as any)?.id;
    return this.ordersService.createOrder(userId, dto);
  }

  @Get('my')
  async listMine(@Req() req: Request, @Query('listingId') listingId?: string) {
    const userId = (req.user as any)?.id;
    return this.ordersService.listMyOrders(userId, listingId);
  }

  @Get(':id')
  async get(@Req() req: Request, @Param('id') id: string) {
    const userId = (req.user as any)?.id;
    return this.ordersService.getOrder(id, userId);
  }
}
