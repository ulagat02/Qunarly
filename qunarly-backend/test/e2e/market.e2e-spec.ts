import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/common/prisma.service';
import { registerAndLogin } from './helpers/auth.helper';
import * as path from 'path';
import { UserRole } from '@prisma/client';

describe('Market e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const createdEmails: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    for (const email of createdEmails) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        const ownedOrders = await prisma.order.findMany({
          where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
          select: { id: true },
        });
        const orderIds = ownedOrders.map((o) => o.id);
        if (orderIds.length) {
          await prisma.handoff.deleteMany({
            where: {
              OR: [{ fromLeg: { orderId: { in: orderIds } } }, { toLeg: { orderId: { in: orderIds } } }],
            },
          });
          await prisma.handoffToken.deleteMany({ where: { leg: { orderId: { in: orderIds } } } });
          await prisma.deliveryLeg.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.delivery.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.deliveryRequest.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.proofEvent.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.commissionRecord.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.orderDispute.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.refundFlag.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.shipmentJob.deleteMany({ where: { orderId: { in: orderIds } } });
          await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
        }
        await prisma.deal.deleteMany({
          where: { OR: [{ sellerId: user.id }, { buyerId: user.id }] },
        });
        await prisma.offer.deleteMany({
          where: { OR: [{ buyerId: user.id }, { listing: { sellerId: user.id } }] },
        });
        await prisma.listingImage.deleteMany({
          where: { listing: { sellerId: user.id } },
        });
        await prisma.productListing.deleteMany({ where: { sellerId: user.id } });
        await prisma.notification.deleteMany({ where: { userId: user.id } });
        await prisma.file.deleteMany({ where: { ownerId: user.id } });
        await prisma.profile.deleteMany({ where: { userId: user.id } });
        await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    }
    await app.close();
  });

  it('Marketplace flow (listing -> offer -> accept -> deal)', async () => {
    const farmer = await registerAndLogin(app, { role: UserRole.FARMER });
    const buyer = await registerAndLogin(app, { role: UserRole.BUYER });
    createdEmails.push(farmer.email, buyer.email);

    const createdListing = await request(app.getHttpServer())
      .post('/market/listings')
      .set('Authorization', `Bearer ${farmer.accessToken}`)
      .send({
        title: 'Wheat',
        description: 'High quality',
        category: 'GRAIN',
        quantity: 10,
        unit: 'kg',
        price: 1200,
        currency: 'KZT',
      })
      .expect(201);

    const listingId = createdListing.body.id as string;

    const withImages = await request(app.getHttpServer())
      .post(`/market/listings/${listingId}/images`)
      .set('Authorization', `Bearer ${farmer.accessToken}`)
      .attach('files', path.join(__dirname, 'fixtures/avatar.png'))
      .expect(201);

    expect(withImages.body.imageUrls?.length).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .get('/market/listings')
      .expect(200);

    await request(app.getHttpServer())
      .get(`/market/listings/${listingId}`)
      .expect(200);

    const offerResponse = await request(app.getHttpServer())
      .post(`/market/listings/${listingId}/offers`)
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .send({
        price: 1100,
        quantity: 10,
        message: 'Ready to buy',
      })
      .expect(201);

    const offerId = offerResponse.body.id as string;

    const offers = await request(app.getHttpServer())
      .get(`/market/listings/${listingId}/offers`)
      .set('Authorization', `Bearer ${farmer.accessToken}`)
      .expect(200);
    expect(offers.body.length).toBeGreaterThan(0);

    const accepted = await request(app.getHttpServer())
      .post(`/market/offers/${offerId}/accept`)
      .set('Authorization', `Bearer ${farmer.accessToken}`)
      .expect(201);
    expect(accepted.body.orderId).toBeTruthy();

    const linkedOrder = await request(app.getHttpServer())
      .get(`/orders/${accepted.body.orderId}`)
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);
    expect(linkedOrder.body.currentLeg !== undefined || linkedOrder.body.legs?.length > 0).toBe(true);

    const farmerDeals = await request(app.getHttpServer())
      .get('/market/deals')
      .set('Authorization', `Bearer ${farmer.accessToken}`)
      .expect(200);
    expect(farmerDeals.body.length).toBeGreaterThan(0);

    const buyerDeals = await request(app.getHttpServer())
      .get('/market/deals')
      .set('Authorization', `Bearer ${buyer.accessToken}`)
      .expect(200);
    expect(buyerDeals.body.length).toBeGreaterThan(0);
  });

  it('POST /market/listings without token -> 401', async () => {
    return request(app.getHttpServer())
      .post('/market/listings')
      .send({
        title: 'Wheat',
        category: 'GRAIN',
        quantity: 10,
        unit: 'kg',
        price: 1200,
        currency: 'KZT',
      })
      .expect(401);
  });

  it('POST /market/listings as BUYER -> 403', async () => {
    const { accessToken, email } = await registerAndLogin(app, {
      role: UserRole.BUYER,
    });
    createdEmails.push(email);

    return request(app.getHttpServer())
      .post('/market/listings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Wheat',
        category: 'GRAIN',
        quantity: 10,
        unit: 'kg',
        price: 1200,
        currency: 'KZT',
      })
      .expect(403);
  });
});
