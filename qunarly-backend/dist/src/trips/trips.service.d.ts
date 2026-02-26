import { PrismaService } from '../common/prisma.service';
export declare class TripsService {
    private prisma;
    constructor(prisma: PrismaService);
    openTrip(driverId: string, dto: {
        routeId: string;
        totalSeats: number;
    }): Promise<{
        driver: {
            id: string;
            phone: string | null;
            avatarUrl: string | null;
            displayName: string | null;
        };
        route: {
            fromHub: {
                id: string;
                name: string;
                regionId: string | null;
                createdAt: Date;
                districtId: string | null;
                isActive: boolean;
                lat: number;
                lng: number;
                updatedAt: Date;
                normalizedName: string;
                radiusKm: number;
            };
            toHub: {
                id: string;
                name: string;
                regionId: string | null;
                createdAt: Date;
                districtId: string | null;
                isActive: boolean;
                lat: number;
                lng: number;
                updatedAt: Date;
                normalizedName: string;
                radiusKm: number;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.RouteStatus;
            createdByUserId: string | null;
            fromHubId: string;
            toHubId: string;
            autoCreated: boolean;
            pairId: string | null;
            routeType: import(".prisma/client").$Enums.RouteType;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TripSessionStatus;
        expiresAt: Date | null;
        driverId: string;
        updatedAt: Date;
        routeId: string;
        totalSeats: number;
        bookedSeats: number;
        closingUntil: Date | null;
    }>;
    listOpenTrips(routeId: string): Promise<{
        remainingSeats: number;
        driver: {
            id: string;
            phone: string | null;
            avatarUrl: string | null;
            displayName: string | null;
        };
        route: {
            fromHub: {
                id: string;
                name: string;
                regionId: string | null;
                createdAt: Date;
                districtId: string | null;
                isActive: boolean;
                lat: number;
                lng: number;
                updatedAt: Date;
                normalizedName: string;
                radiusKm: number;
            };
            toHub: {
                id: string;
                name: string;
                regionId: string | null;
                createdAt: Date;
                districtId: string | null;
                isActive: boolean;
                lat: number;
                lng: number;
                updatedAt: Date;
                normalizedName: string;
                radiusKm: number;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.RouteStatus;
            createdByUserId: string | null;
            fromHubId: string;
            toHubId: string;
            autoCreated: boolean;
            pairId: string | null;
            routeType: import(".prisma/client").$Enums.RouteType;
        };
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TripSessionStatus;
        expiresAt: Date | null;
        driverId: string;
        updatedAt: Date;
        routeId: string;
        totalSeats: number;
        bookedSeats: number;
        closingUntil: Date | null;
    }[]>;
    joinTrip(tripId: string, passengerId: string, seatCount: number): Promise<({
        trip: {
            driver: {
                id: string;
                phone: string | null;
                avatarUrl: string | null;
                displayName: string | null;
            };
            route: {
                fromHub: {
                    id: string;
                    name: string;
                    regionId: string | null;
                    createdAt: Date;
                    districtId: string | null;
                    isActive: boolean;
                    lat: number;
                    lng: number;
                    updatedAt: Date;
                    normalizedName: string;
                    radiusKm: number;
                };
                toHub: {
                    id: string;
                    name: string;
                    regionId: string | null;
                    createdAt: Date;
                    districtId: string | null;
                    isActive: boolean;
                    lat: number;
                    lng: number;
                    updatedAt: Date;
                    normalizedName: string;
                    radiusKm: number;
                };
            } & {
                id: string;
                createdAt: Date;
                status: import(".prisma/client").$Enums.RouteStatus;
                createdByUserId: string | null;
                fromHubId: string;
                toHubId: string;
                autoCreated: boolean;
                pairId: string | null;
                routeType: import(".prisma/client").$Enums.RouteType;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TripSessionStatus;
            expiresAt: Date | null;
            driverId: string;
            updatedAt: Date;
            routeId: string;
            totalSeats: number;
            bookedSeats: number;
            closingUntil: Date | null;
        };
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TripBookingStatus;
        passengerId: string;
        tripId: string;
        seatCount: number;
    }) | null>;
    leaveTrip(tripId: string, passengerId: string): Promise<void>;
    closeIntent(tripId: string, driverId: string): Promise<{
        driver: {
            id: string;
            phone: string | null;
            avatarUrl: string | null;
            displayName: string | null;
        };
        route: {
            fromHub: {
                id: string;
                name: string;
                regionId: string | null;
                createdAt: Date;
                districtId: string | null;
                isActive: boolean;
                lat: number;
                lng: number;
                updatedAt: Date;
                normalizedName: string;
                radiusKm: number;
            };
            toHub: {
                id: string;
                name: string;
                regionId: string | null;
                createdAt: Date;
                districtId: string | null;
                isActive: boolean;
                lat: number;
                lng: number;
                updatedAt: Date;
                normalizedName: string;
                radiusKm: number;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.RouteStatus;
            createdByUserId: string | null;
            fromHubId: string;
            toHubId: string;
            autoCreated: boolean;
            pairId: string | null;
            routeType: import(".prisma/client").$Enums.RouteType;
        };
        bookings: ({
            passenger: {
                id: string;
                phone: string | null;
                displayName: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TripBookingStatus;
            passengerId: string;
            tripId: string;
            seatCount: number;
        })[];
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TripSessionStatus;
        expiresAt: Date | null;
        driverId: string;
        updatedAt: Date;
        routeId: string;
        totalSeats: number;
        bookedSeats: number;
        closingUntil: Date | null;
    }>;
    startTrip(tripId: string, driverId: string): Promise<{
        driver: {
            id: string;
            phone: string | null;
            avatarUrl: string | null;
            displayName: string | null;
        };
        route: {
            fromHub: {
                id: string;
                name: string;
                regionId: string | null;
                createdAt: Date;
                districtId: string | null;
                isActive: boolean;
                lat: number;
                lng: number;
                updatedAt: Date;
                normalizedName: string;
                radiusKm: number;
            };
            toHub: {
                id: string;
                name: string;
                regionId: string | null;
                createdAt: Date;
                districtId: string | null;
                isActive: boolean;
                lat: number;
                lng: number;
                updatedAt: Date;
                normalizedName: string;
                radiusKm: number;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.RouteStatus;
            createdByUserId: string | null;
            fromHubId: string;
            toHubId: string;
            autoCreated: boolean;
            pairId: string | null;
            routeType: import(".prisma/client").$Enums.RouteType;
        };
        bookings: ({
            passenger: {
                id: string;
                phone: string | null;
                displayName: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TripBookingStatus;
            passengerId: string;
            tripId: string;
            seatCount: number;
        })[];
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TripSessionStatus;
        expiresAt: Date | null;
        driverId: string;
        updatedAt: Date;
        routeId: string;
        totalSeats: number;
        bookedSeats: number;
        closingUntil: Date | null;
    }>;
    completeTrip(tripId: string, driverId: string): Promise<{
        driver: {
            id: string;
            phone: string | null;
            avatarUrl: string | null;
            displayName: string | null;
        };
        route: {
            fromHub: {
                id: string;
                name: string;
                regionId: string | null;
                createdAt: Date;
                districtId: string | null;
                isActive: boolean;
                lat: number;
                lng: number;
                updatedAt: Date;
                normalizedName: string;
                radiusKm: number;
            };
            toHub: {
                id: string;
                name: string;
                regionId: string | null;
                createdAt: Date;
                districtId: string | null;
                isActive: boolean;
                lat: number;
                lng: number;
                updatedAt: Date;
                normalizedName: string;
                radiusKm: number;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.RouteStatus;
            createdByUserId: string | null;
            fromHubId: string;
            toHubId: string;
            autoCreated: boolean;
            pairId: string | null;
            routeType: import(".prisma/client").$Enums.RouteType;
        };
        bookings: ({
            passenger: {
                id: string;
                phone: string | null;
                displayName: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TripBookingStatus;
            passengerId: string;
            tripId: string;
            seatCount: number;
        })[];
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TripSessionStatus;
        expiresAt: Date | null;
        driverId: string;
        updatedAt: Date;
        routeId: string;
        totalSeats: number;
        bookedSeats: number;
        closingUntil: Date | null;
    }>;
    cancelTrip(tripId: string, driverId: string): Promise<{
        driver: {
            id: string;
            phone: string | null;
            avatarUrl: string | null;
            displayName: string | null;
        };
        route: {
            fromHub: {
                id: string;
                name: string;
                regionId: string | null;
                createdAt: Date;
                districtId: string | null;
                isActive: boolean;
                lat: number;
                lng: number;
                updatedAt: Date;
                normalizedName: string;
                radiusKm: number;
            };
            toHub: {
                id: string;
                name: string;
                regionId: string | null;
                createdAt: Date;
                districtId: string | null;
                isActive: boolean;
                lat: number;
                lng: number;
                updatedAt: Date;
                normalizedName: string;
                radiusKm: number;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.RouteStatus;
            createdByUserId: string | null;
            fromHubId: string;
            toHubId: string;
            autoCreated: boolean;
            pairId: string | null;
            routeType: import(".prisma/client").$Enums.RouteType;
        };
        bookings: ({
            passenger: {
                id: string;
                phone: string | null;
                displayName: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TripBookingStatus;
            passengerId: string;
            tripId: string;
            seatCount: number;
        })[];
    } & {
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TripSessionStatus;
        expiresAt: Date | null;
        driverId: string;
        updatedAt: Date;
        routeId: string;
        totalSeats: number;
        bookedSeats: number;
        closingUntil: Date | null;
    }>;
    getActiveForUser(userId: string): Promise<{
        activeTripSession: ({
            driver: {
                id: string;
                phone: string | null;
                avatarUrl: string | null;
                displayName: string | null;
            };
            route: {
                fromHub: {
                    id: string;
                    name: string;
                    regionId: string | null;
                    createdAt: Date;
                    districtId: string | null;
                    isActive: boolean;
                    lat: number;
                    lng: number;
                    updatedAt: Date;
                    normalizedName: string;
                    radiusKm: number;
                };
                toHub: {
                    id: string;
                    name: string;
                    regionId: string | null;
                    createdAt: Date;
                    districtId: string | null;
                    isActive: boolean;
                    lat: number;
                    lng: number;
                    updatedAt: Date;
                    normalizedName: string;
                    radiusKm: number;
                };
            } & {
                id: string;
                createdAt: Date;
                status: import(".prisma/client").$Enums.RouteStatus;
                createdByUserId: string | null;
                fromHubId: string;
                toHubId: string;
                autoCreated: boolean;
                pairId: string | null;
                routeType: import(".prisma/client").$Enums.RouteType;
            };
            bookings: ({
                passenger: {
                    id: string;
                    phone: string | null;
                    displayName: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                status: import(".prisma/client").$Enums.TripBookingStatus;
                passengerId: string;
                tripId: string;
                seatCount: number;
            })[];
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TripSessionStatus;
            expiresAt: Date | null;
            driverId: string;
            updatedAt: Date;
            routeId: string;
            totalSeats: number;
            bookedSeats: number;
            closingUntil: Date | null;
        }) | null;
        activeBooking: ({
            trip: {
                driver: {
                    id: string;
                    phone: string | null;
                    avatarUrl: string | null;
                    displayName: string | null;
                };
                route: {
                    fromHub: {
                        id: string;
                        name: string;
                        regionId: string | null;
                        createdAt: Date;
                        districtId: string | null;
                        isActive: boolean;
                        lat: number;
                        lng: number;
                        updatedAt: Date;
                        normalizedName: string;
                        radiusKm: number;
                    };
                    toHub: {
                        id: string;
                        name: string;
                        regionId: string | null;
                        createdAt: Date;
                        districtId: string | null;
                        isActive: boolean;
                        lat: number;
                        lng: number;
                        updatedAt: Date;
                        normalizedName: string;
                        radiusKm: number;
                    };
                } & {
                    id: string;
                    createdAt: Date;
                    status: import(".prisma/client").$Enums.RouteStatus;
                    createdByUserId: string | null;
                    fromHubId: string;
                    toHubId: string;
                    autoCreated: boolean;
                    pairId: string | null;
                    routeType: import(".prisma/client").$Enums.RouteType;
                };
            } & {
                id: string;
                createdAt: Date;
                status: import(".prisma/client").$Enums.TripSessionStatus;
                expiresAt: Date | null;
                driverId: string;
                updatedAt: Date;
                routeId: string;
                totalSeats: number;
                bookedSeats: number;
                closingUntil: Date | null;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TripBookingStatus;
            passengerId: string;
            tripId: string;
            seatCount: number;
        }) | null;
    }>;
    getTrip(tripId: string): Promise<{
        remainingSeats: number;
        driver: {
            id: string;
            phone: string | null;
            avatarUrl: string | null;
            displayName: string | null;
        };
        route: {
            fromHub: {
                id: string;
                name: string;
                regionId: string | null;
                createdAt: Date;
                districtId: string | null;
                isActive: boolean;
                lat: number;
                lng: number;
                updatedAt: Date;
                normalizedName: string;
                radiusKm: number;
            };
            toHub: {
                id: string;
                name: string;
                regionId: string | null;
                createdAt: Date;
                districtId: string | null;
                isActive: boolean;
                lat: number;
                lng: number;
                updatedAt: Date;
                normalizedName: string;
                radiusKm: number;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.RouteStatus;
            createdByUserId: string | null;
            fromHubId: string;
            toHubId: string;
            autoCreated: boolean;
            pairId: string | null;
            routeType: import(".prisma/client").$Enums.RouteType;
        };
        bookings: ({
            passenger: {
                id: string;
                phone: string | null;
                displayName: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.TripBookingStatus;
            passengerId: string;
            tripId: string;
            seatCount: number;
        })[];
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.TripSessionStatus;
        expiresAt: Date | null;
        driverId: string;
        updatedAt: Date;
        routeId: string;
        totalSeats: number;
        bookedSeats: number;
        closingUntil: Date | null;
    }>;
    expireTripSessions(): Promise<void>;
}
