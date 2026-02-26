import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';

const TRIP_EXPIRY_HOURS = 2;
const CLOSING_BUFFER_SEC = 10;

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  async openTrip(driverId: string, dto: { routeId: string; totalSeats: number }) {
    const route = await this.prisma.taxiRoute.findUnique({
      where: { id: dto.routeId },
    });
    if (!route || route.status === 'ARCHIVED') {
      throw new BadRequestException('Route not found');
    }

    const active = await this.prisma.tripSession.findFirst({
      where: {
        driverId,
        status: { in: ['OPEN', 'CLOSING', 'IN_PROGRESS'] },
      },
    });
    if (active) {
      throw new ConflictException('Active trip session exists');
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + TRIP_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    return this.prisma.tripSession.create({
      data: {
        driverId,
        routeId: dto.routeId,
        totalSeats: dto.totalSeats,
        status: 'OPEN',
        bookedSeats: 0,
        expiresAt,
      },
      include: {
        route: { include: { fromHub: true, toHub: true } },
        driver: {
          select: {
            id: true,
            displayName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async listOpenTrips(routeId: string) {
    const now = new Date();
    const sessions = await this.prisma.tripSession.findMany({
      where: {
        routeId,
        status: 'OPEN',
        expiresAt: { gt: now },
      },
      include: {
        route: { include: { fromHub: true, toHub: true } },
        driver: {
          select: {
            id: true,
            displayName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });
    return sessions.map((s) => ({
      ...s,
      remainingSeats: s.totalSeats - s.bookedSeats,
    }));
  }

  async joinTrip(tripId: string, passengerId: string, seatCount: number) {
    const activeBooking = await this.prisma.tripBooking.findFirst({
      where: {
        passengerId,
        status: 'ACTIVE',
        trip: {
          status: { in: ['OPEN', 'CLOSING', 'IN_PROGRESS'] },
        },
      },
    });
    if (activeBooking) {
      throw new ConflictException('Active booking exists');
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.tripBooking.findUnique({
        where: {
          tripId_passengerId: { tripId, passengerId },
        },
      });
      if (existing) {
        throw new ConflictException('Already booked on this trip');
      }

      const updated = await tx.$queryRaw<
        { bookedSeats: number; totalSeats: number; status: string }[]
      >`
        UPDATE "TripSession"
        SET "bookedSeats" = "bookedSeats" + ${seatCount}
        WHERE "id" = ${tripId}
          AND "status" = 'OPEN'
          AND ("bookedSeats" + ${seatCount}) <= "totalSeats"
        RETURNING "bookedSeats", "totalSeats", "status"
      `;

      if (!updated || updated.length === 0) {
        const trip = await tx.tripSession.findUnique({
          where: { id: tripId },
        });
        if (!trip) {
          throw new NotFoundException('Trip not found');
        }
        if (trip.status !== 'OPEN') {
          throw new ConflictException(
            trip.status === 'CLOSING' ? 'Рейс жабылып жатыр' : 'Trip is not accepting bookings',
          );
        }
        throw new ConflictException('Not enough seats');
      }

      const row = updated[0];
      if (row.bookedSeats > row.totalSeats) {
        throw new Error(
          `invariant violation: bookedSeats(${row.bookedSeats}) > totalSeats(${row.totalSeats})`,
        );
      }

      const booking = await tx.tripBooking.create({
        data: {
          tripId,
          passengerId,
          seatCount,
          status: 'ACTIVE',
        },
      });

      return tx.tripBooking.findUnique({
        where: { id: booking.id },
        include: {
          trip: {
            include: {
              route: { include: { fromHub: true, toHub: true } },
              driver: {
                select: {
                  id: true,
                  displayName: true,
                  phone: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
    });
  }

  async leaveTrip(tripId: string, passengerId: string) {
    const trip = await this.prisma.tripSession.findUnique({
      where: { id: tripId },
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    if (!['OPEN', 'CLOSING'].includes(trip.status)) {
      throw new BadRequestException(
        'Leave only allowed when trip is OPEN or CLOSING',
      );
    }

    const booking = await this.prisma.tripBooking.findUnique({
      where: {
        tripId_passengerId: { tripId, passengerId },
      },
    });
    if (!booking || booking.status !== 'ACTIVE') {
      throw new NotFoundException('Active booking not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.tripBooking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED' },
      });
      await tx.tripSession.update({
        where: { id: tripId },
        data: { bookedSeats: { decrement: booking.seatCount } },
      });
    });
  }

  async closeIntent(tripId: string, driverId: string) {
    const trip = await this.prisma.tripSession.findUnique({
      where: { id: tripId },
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    if (trip.driverId !== driverId) {
      throw new BadRequestException('Not the trip driver');
    }
    if (trip.status !== 'OPEN') {
      throw new BadRequestException('Trip is not OPEN');
    }

    const now = new Date();
    const closingUntil = new Date(
      now.getTime() + CLOSING_BUFFER_SEC * 1000,
    );

    return this.prisma.tripSession.update({
      where: { id: tripId },
      data: { status: 'CLOSING', closingUntil },
      include: {
        route: { include: { fromHub: true, toHub: true } },
        driver: {
          select: {
            id: true,
            displayName: true,
            phone: true,
            avatarUrl: true,
          },
        },
        bookings: {
          where: { status: 'ACTIVE' },
          include: {
            passenger: {
              select: {
                id: true,
                displayName: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  async startTrip(tripId: string, driverId: string) {
    const trip = await this.prisma.tripSession.findUnique({
      where: { id: tripId },
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    if (trip.driverId !== driverId) {
      throw new BadRequestException('Not the trip driver');
    }
    if (trip.status !== 'CLOSING') {
      throw new BadRequestException('Trip must be CLOSING to start');
    }

    return this.prisma.tripSession.update({
      where: { id: tripId },
      data: { status: 'IN_PROGRESS', closingUntil: null },
      include: {
        route: { include: { fromHub: true, toHub: true } },
        driver: {
          select: {
            id: true,
            displayName: true,
            phone: true,
            avatarUrl: true,
          },
        },
        bookings: {
          where: { status: 'ACTIVE' },
          include: {
            passenger: {
              select: {
                id: true,
                displayName: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  async completeTrip(tripId: string, driverId: string) {
    const trip = await this.prisma.tripSession.findUnique({
      where: { id: tripId },
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    if (trip.driverId !== driverId) {
      throw new BadRequestException('Not the trip driver');
    }
    if (trip.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Trip must be IN_PROGRESS to complete');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.tripBooking.updateMany({
        where: { tripId, status: 'ACTIVE' },
        data: { status: 'COMPLETED' },
      });
      return tx.tripSession.update({
        where: { id: tripId },
        data: { status: 'COMPLETED' },
        include: {
          route: { include: { fromHub: true, toHub: true } },
          driver: {
            select: {
              id: true,
              displayName: true,
              phone: true,
              avatarUrl: true,
            },
          },
          bookings: {
            include: {
              passenger: {
                select: {
                  id: true,
                  displayName: true,
                  phone: true,
                },
              },
            },
          },
        },
      });
    });
  }

  async cancelTrip(tripId: string, driverId: string) {
    const trip = await this.prisma.tripSession.findUnique({
      where: { id: tripId },
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    if (trip.driverId !== driverId) {
      throw new BadRequestException('Not the trip driver');
    }
    if (trip.status !== 'OPEN') {
      throw new BadRequestException('Cancel only allowed when trip is OPEN');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.tripBooking.updateMany({
        where: { tripId, status: 'ACTIVE' },
        data: { status: 'CANCELLED' },
      });
      return tx.tripSession.update({
        where: { id: tripId },
        data: { status: 'CANCELLED' },
        include: {
          route: { include: { fromHub: true, toHub: true } },
          driver: {
            select: {
              id: true,
              displayName: true,
              phone: true,
              avatarUrl: true,
            },
          },
          bookings: {
            include: {
              passenger: {
                select: {
                  id: true,
                  displayName: true,
                  phone: true,
                },
              },
            },
          },
        },
      });
    });
  }

  async getActiveForUser(userId: string) {
    const [activeTripSession, activeBooking] = await Promise.all([
      this.prisma.tripSession.findFirst({
        where: {
          driverId: userId,
          status: { in: ['OPEN', 'CLOSING', 'IN_PROGRESS'] },
        },
        include: {
          route: { include: { fromHub: true, toHub: true } },
          driver: {
            select: {
              id: true,
              displayName: true,
              phone: true,
              avatarUrl: true,
            },
          },
          bookings: {
            where: { status: 'ACTIVE' },
            include: {
              passenger: {
                select: {
                  id: true,
                  displayName: true,
                  phone: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.tripBooking.findFirst({
        where: {
          passengerId: userId,
          status: 'ACTIVE',
          trip: {
            status: { in: ['OPEN', 'CLOSING', 'IN_PROGRESS'] },
          },
        },
        include: {
          trip: {
            include: {
              route: { include: { fromHub: true, toHub: true } },
              driver: {
                select: {
                  id: true,
                  displayName: true,
                  phone: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      activeTripSession: activeTripSession ?? null,
      activeBooking: activeBooking ?? null,
    };
  }

  async getTrip(tripId: string) {
    const trip = await this.prisma.tripSession.findUnique({
      where: { id: tripId },
      include: {
        route: { include: { fromHub: true, toHub: true } },
        driver: {
          select: {
            id: true,
            displayName: true,
            phone: true,
            avatarUrl: true,
          },
        },
        bookings: {
          where: { status: 'ACTIVE' },
          include: {
            passenger: {
              select: {
                id: true,
                displayName: true,
                phone: true,
              },
            },
          },
        },
      },
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    return {
      ...trip,
      remainingSeats: trip.totalSeats - trip.bookedSeats,
    };
  }

  @Cron('* * * * *')
  async expireTripSessions() {
    const now = new Date();
    await this.prisma.tripSession.updateMany({
      where: {
        status: { in: ['OPEN', 'CLOSING'] },
        expiresAt: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });
  }
}
