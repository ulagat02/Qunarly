import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@prisma/client';
import { OrdersService } from '../orders/orders.service';
import { ConfirmPaymentDto } from '../orders/dto/confirm-payment.dto';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private ordersService: OrdersService) {}

  @Get('health')
  health() {
    return { status: 'stub' };
  }

  @Post('confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async confirmPayment(@Body() dto: ConfirmPaymentDto) {
    return this.ordersService.confirmPayment(dto);
  }

  @Post('webhook')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async webhook(@Body() dto: ConfirmPaymentDto) {
    return this.ordersService.confirmPayment(dto);
  }
}
