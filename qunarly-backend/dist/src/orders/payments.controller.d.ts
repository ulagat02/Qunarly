import { OrdersService } from './orders.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
export declare class PaymentsController {
    private ordersService;
    constructor(ordersService: OrdersService);
    confirmPayment(dto: ConfirmPaymentDto): Promise<{
        ok: boolean;
        orderId: string;
    }>;
    webhook(dto: ConfirmPaymentDto): Promise<{
        ok: boolean;
        orderId: string;
    }>;
}
