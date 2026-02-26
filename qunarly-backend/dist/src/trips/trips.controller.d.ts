import { Request } from 'express';
import { OpenTripDto } from './dto/open-trip.dto';
import { JoinTripDto } from './dto/join-trip.dto';
import { TripsService } from './trips.service';
export declare class TripsController {
    private tripsService;
    constructor(tripsService: TripsService);
    openTrip(req: Request, dto: OpenTripDto): Promise<{
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
    listOpenTrips(routeId?: string): Promise<{
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
    joinTrip(id: string, req: Request, dto: JoinTripDto): Promise<({
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
    leaveTrip(id: string, req: Request): Promise<void>;
    closeIntent(id: string, req: Request): Promise<{
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
    startTrip(id: string, req: Request): Promise<{
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
    completeTrip(id: string, req: Request): Promise<{
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
    cancelTrip(id: string, req: Request): Promise<{
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
    getActive(req: Request): Promise<{
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
    getTrip(id: string): Promise<{
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
}
