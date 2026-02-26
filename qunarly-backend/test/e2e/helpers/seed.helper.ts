import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../../src/common/prisma.service';
import { registerAndLogin } from './auth.helper';
import { ProductListingStatus, UserRole } from '@prisma/client';

export const seedBaseEntities = async (app: INestApplication, prisma: PrismaService) => {
  const existingRegion = await prisma.region.findFirst({
    where: { name: 'Test Region', parentId: null },
  });
  const region =
    existingRegion ??
    (await prisma.region.create({
      data: { name: 'Test Region' },
    }));
  const existingDistrict = await prisma.district.findFirst({
    where: { name: 'Test District', regionId: region.id },
  });
  const district =
    existingDistrict ??
    (await prisma.district.create({
      data: { name: 'Test District', regionId: region.id },
    }));

  const seller = await registerAndLogin(app, { role: UserRole.FARMER });
  const buyer = await registerAndLogin(app, { role: UserRole.BUYER });
  const driver = await registerAndLogin(app, { role: UserRole.CARRIER });

  await prisma.user.update({
    where: { email: seller.email },
    data: { regionId: region.id, districtId: district.id },
  });
  await prisma.user.update({
    where: { email: buyer.email },
    data: {
      regionId: region.id,
      districtId: district.id,
      homeLat: 43.25,
      homeLng: 76.9,
      homeAddressText: 'Test Buyer Address',
    },
  });

  const sellerUser = await prisma.user.findUnique({ where: { email: seller.email } });
  if (!sellerUser) {
    throw new Error('Seed failed: seller user not found');
  }

  const listing = await prisma.productListing.create({
    data: {
      sellerId: sellerUser.id,
      category: 'GRAIN',
      title: 'Seeded Wheat',
      description: 'Seeded listing',
      quantity: 100,
      unit: 'kg',
      price: 1200,
      currency: 'KZT',
      addressText: 'Seeded Listing Address',
      districtId: district.id,
      regionId: region.id,
      lat: 43.25,
      lng: 76.91,
      status: ProductListingStatus.PUBLISHED,
    },
  });

  return {
    region,
    district,
    listing,
    seller,
    buyer,
    driver,
  };
};
