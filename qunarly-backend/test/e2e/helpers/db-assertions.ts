import { PrismaService } from '../../../src/common/prisma.service';

export const fetchOrderWithRelations = async (prisma: PrismaService, orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      listing: true,
      delivery: true,
      deliveryRecord: true,
      legs: true,
      shipmentJob: true,
    },
  });
  if (!order) {
    throw new Error(`DB assertion failed: Order ${orderId} not found`);
  }
  return order;
};

export const assertOrderRelations = (order: {
  delivery: unknown | null;
  legs: unknown[];
}) => {
  if (!order.delivery) {
    throw new Error('DB assertion failed: delivery request is missing');
  }
  if (!order.legs || order.legs.length === 0) {
    throw new Error('DB assertion failed: delivery legs are missing');
  }
};
