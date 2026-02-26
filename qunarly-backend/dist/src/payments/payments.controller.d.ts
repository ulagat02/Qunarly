import { OrdersService } from '../orders/orders.service';
import { ConfirmPaymentDto } from '../orders/dto/confirm-payment.dto';
export declare class PaymentsController {
    private ordersService;
    constructor(ordersService: OrdersService);
    health(): {
        status: string;
    };
    confirmPayment(dto: ConfirmPaymentDto): Promise<{
        ok: boolean;
        orderId: string;
        shipmentJobId: string | null;
    }>;
    webhook(dto: ConfirmPaymentDto): Promise<{
        ok: boolean;
        orderId: string;
        shipmentJobId: string | null;
    }>;
}
