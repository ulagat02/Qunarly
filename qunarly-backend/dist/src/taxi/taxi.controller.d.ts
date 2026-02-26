import { Request } from 'express';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { JoinQueueDto } from './dto/join-queue.dto';
import { CreateRouteDto } from './dto/create-route.dto';
import { EnsureRouteDto } from './dto/ensure-route.dto';
import { TaxiService } from './taxi.service';
export declare class TaxiController {
    private taxiService;
    constructor(taxiService: TaxiService);
    createRequest(req: Request, dto: CreateRideRequestDto): Promise<{
        routeStatus: "ACTIVE";
        queuePosition: number;
        estimatedDepartureType: import(".prisma/client").$Enums.DepartureType;
        id: string;
        routeId: string;
        passengerId: string;
        pickupText: string;
        pickupLat: number | null;
        pickupLng: number | null;
        seats: number;
        status: import(".prisma/client").$Enums.RideRequestStatus;
        assignedDriverId: string | null;
        currentOfferId: string | null;
        clientRequestId: string | null;
        createdAt: Date;
        updatedAt: Date;
        cargoType: import(".prisma/client").$Enums.CargoType;
        departureType: import(".prisma/client").$Enums.DepartureType;
        waitUntilFull: boolean;
    }>;
    createRoute(dto: CreateRouteDto): Promise<{
        fromHub: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            normalizedName: string;
            lat: number;
            lng: number;
            radiusKm: number;
            isActive: boolean;
            districtId: string | null;
            regionId: string | null;
        };
        toHub: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            normalizedName: string;
            lat: number;
            lng: number;
            radiusKm: number;
            isActive: boolean;
            districtId: string | null;
            regionId: string | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.RouteStatus;
        createdAt: Date;
        fromHubId: string;
        toHubId: string;
        autoCreated: boolean;
        pairId: string | null;
        routeType: import(".prisma/client").$Enums.RouteType;
        createdByUserId: string | null;
    }>;
    ensureRoute(req: Request, dto: EnsureRouteDto): Promise<({
        fromHub: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            normalizedName: string;
            lat: number;
            lng: number;
            radiusKm: number;
            isActive: boolean;
            districtId: string | null;
            regionId: string | null;
        };
        toHub: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            normalizedName: string;
            lat: number;
            lng: number;
            radiusKm: number;
            isActive: boolean;
            districtId: string | null;
            regionId: string | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.RouteStatus;
        createdAt: Date;
        fromHubId: string;
        toHubId: string;
        autoCreated: boolean;
        pairId: string | null;
        routeType: import(".prisma/client").$Enums.RouteType;
        createdByUserId: string | null;
    }) | null>;
    listRoutes(originVillageId?: string, destVillageId?: string, mode?: 'passenger' | 'driver'): Promise<({
        fromHub: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            normalizedName: string;
            lat: number;
            lng: number;
            radiusKm: number;
            isActive: boolean;
            districtId: string | null;
            regionId: string | null;
        };
        toHub: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            normalizedName: string;
            lat: number;
            lng: number;
            radiusKm: number;
            isActive: boolean;
            districtId: string | null;
            regionId: string | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.RouteStatus;
        createdAt: Date;
        fromHubId: string;
        toHubId: string;
        autoCreated: boolean;
        pairId: string | null;
        routeType: import(".prisma/client").$Enums.RouteType;
        createdByUserId: string | null;
    })[]>;
    getRequest(id: string): Promise<{
        offers: {
            id: string;
            routeId: string;
            status: import(".prisma/client").$Enums.DriverOfferStatus;
            createdAt: Date;
            requestId: string;
            driverId: string;
            expiresAt: Date;
        }[];
        assignedDriver: {
            id: string;
            phone: string | null;
            avatarUrl: string | null;
            displayName: string | null;
        } | null;
        route: {
            fromHub: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                normalizedName: string;
                lat: number;
                lng: number;
                radiusKm: number;
                isActive: boolean;
                districtId: string | null;
                regionId: string | null;
            };
            toHub: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                normalizedName: string;
                lat: number;
                lng: number;
                radiusKm: number;
                isActive: boolean;
                districtId: string | null;
                regionId: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.RouteStatus;
            createdAt: Date;
            fromHubId: string;
            toHubId: string;
            autoCreated: boolean;
            pairId: string | null;
            routeType: import(".prisma/client").$Enums.RouteType;
            createdByUserId: string | null;
        };
    } & {
        id: string;
        routeId: string;
        passengerId: string;
        pickupText: string;
        pickupLat: number | null;
        pickupLng: number | null;
        seats: number;
        status: import(".prisma/client").$Enums.RideRequestStatus;
        assignedDriverId: string | null;
        currentOfferId: string | null;
        clientRequestId: string | null;
        createdAt: Date;
        updatedAt: Date;
        cargoType: import(".prisma/client").$Enums.CargoType;
        departureType: import(".prisma/client").$Enums.DepartureType;
        waitUntilFull: boolean;
    }>;
    queueDrivers(routeId?: string): Promise<{
        driverId: string;
        displayName: string;
        phone: string | null;
        avatarUrl: string | null;
        status: import(".prisma/client").$Enums.DriverQueueStatus;
        availableSeats: number;
        capacity: number;
        joinedAt: Date;
    }[]>;
    joinQueue(req: Request, dto: JoinQueueDto): Promise<{
        id: string;
        routeId: string;
        status: import(".prisma/client").$Enums.DriverQueueStatus;
        driverId: string;
        expiresAt: Date | null;
        joinedAt: Date;
        availableSeats: number;
        capacity: number;
        lastPingAt: Date | null;
        calledExpiresAt: Date | null;
    }>;
    queuePing(req: Request, routeId?: string): Promise<{
        ok: boolean;
        expiresAt: Date;
    } | null>;
    queueStatus(req: Request, routeId?: string): Promise<{
        queue: {
            id: string;
            routeId: string;
            status: import(".prisma/client").$Enums.DriverQueueStatus;
            driverId: string;
            expiresAt: Date | null;
            joinedAt: Date;
            availableSeats: number;
            capacity: number;
            lastPingAt: Date | null;
            calledExpiresAt: Date | null;
        } | null;
        passengerCount: number;
    } | null>;
    queuePassengers(req: Request, routeId?: string, expireMinutes?: string): Promise<{
        id: string;
        userId: string;
        displayName: string;
        avatarUrl: string | null;
        seatsRequested: number;
        pickupLabel: string;
        departLabel: string;
        status: import(".prisma/client").$Enums.RideRequestStatus;
    }[]>;
    pendingOffers(req: Request): Promise<({
        route: {
            fromHub: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                normalizedName: string;
                lat: number;
                lng: number;
                radiusKm: number;
                isActive: boolean;
                districtId: string | null;
                regionId: string | null;
            };
            toHub: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                normalizedName: string;
                lat: number;
                lng: number;
                radiusKm: number;
                isActive: boolean;
                districtId: string | null;
                regionId: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.RouteStatus;
            createdAt: Date;
            fromHubId: string;
            toHubId: string;
            autoCreated: boolean;
            pairId: string | null;
            routeType: import(".prisma/client").$Enums.RouteType;
            createdByUserId: string | null;
        };
        request: {
            passenger: {
                id: string;
                phone: string | null;
                displayName: string | null;
            };
        } & {
            id: string;
            routeId: string;
            passengerId: string;
            pickupText: string;
            pickupLat: number | null;
            pickupLng: number | null;
            seats: number;
            status: import(".prisma/client").$Enums.RideRequestStatus;
            assignedDriverId: string | null;
            currentOfferId: string | null;
            clientRequestId: string | null;
            createdAt: Date;
            updatedAt: Date;
            cargoType: import(".prisma/client").$Enums.CargoType;
            departureType: import(".prisma/client").$Enums.DepartureType;
            waitUntilFull: boolean;
        };
    } & {
        id: string;
        routeId: string;
        status: import(".prisma/client").$Enums.DriverOfferStatus;
        createdAt: Date;
        requestId: string;
        driverId: string;
        expiresAt: Date;
    })[]>;
    activeDriverRequest(req: Request): Promise<({
        passenger: {
            id: string;
            phone: string | null;
            avatarUrl: string | null;
            displayName: string | null;
        };
        route: {
            fromHub: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                normalizedName: string;
                lat: number;
                lng: number;
                radiusKm: number;
                isActive: boolean;
                districtId: string | null;
                regionId: string | null;
            };
            toHub: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                normalizedName: string;
                lat: number;
                lng: number;
                radiusKm: number;
                isActive: boolean;
                districtId: string | null;
                regionId: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.RouteStatus;
            createdAt: Date;
            fromHubId: string;
            toHubId: string;
            autoCreated: boolean;
            pairId: string | null;
            routeType: import(".prisma/client").$Enums.RouteType;
            createdByUserId: string | null;
        };
    } & {
        id: string;
        routeId: string;
        passengerId: string;
        pickupText: string;
        pickupLat: number | null;
        pickupLng: number | null;
        seats: number;
        status: import(".prisma/client").$Enums.RideRequestStatus;
        assignedDriverId: string | null;
        currentOfferId: string | null;
        clientRequestId: string | null;
        createdAt: Date;
        updatedAt: Date;
        cargoType: import(".prisma/client").$Enums.CargoType;
        departureType: import(".prisma/client").$Enums.DepartureType;
        waitUntilFull: boolean;
    }) | null>;
    acceptOffer(req: Request, offerId: string, body: {
        actionId?: string;
    }): Promise<object>;
    rejectOffer(req: Request, offerId: string): Promise<{
        ok: boolean;
    }>;
    confirmQueuePassenger(req: Request, requestId: string): Promise<{
        ok: boolean;
    }>;
    skipQueuePassenger(req: Request, requestId: string): Promise<{
        id: string;
        routeId: string;
        passengerId: string;
        pickupText: string;
        pickupLat: number | null;
        pickupLng: number | null;
        seats: number;
        status: import(".prisma/client").$Enums.RideRequestStatus;
        assignedDriverId: string | null;
        currentOfferId: string | null;
        clientRequestId: string | null;
        createdAt: Date;
        updatedAt: Date;
        cargoType: import(".prisma/client").$Enums.CargoType;
        departureType: import(".prisma/client").$Enums.DepartureType;
        waitUntilFull: boolean;
    }>;
    removeQueuePassenger(req: Request, requestId: string, reason: 'REMOVED_BY_DRIVER' | 'NO_SHOW'): Promise<{
        ok: boolean;
    }>;
    queueOnTheWay(req: Request, routeId?: string): Promise<{
        id: string;
        routeId: string;
        status: import(".prisma/client").$Enums.DriverQueueStatus;
        driverId: string;
        expiresAt: Date | null;
        joinedAt: Date;
        availableSeats: number;
        capacity: number;
        lastPingAt: Date | null;
        calledExpiresAt: Date | null;
    } | null>;
    queueInactive(req: Request, routeId?: string): Promise<{
        id: string;
        routeId: string;
        status: import(".prisma/client").$Enums.DriverQueueStatus;
        driverId: string;
        expiresAt: Date | null;
        joinedAt: Date;
        availableSeats: number;
        capacity: number;
        lastPingAt: Date | null;
        calledExpiresAt: Date | null;
    } | null>;
    onTheWay(req: Request, id: string): Promise<{
        id: string;
        routeId: string;
        passengerId: string;
        pickupText: string;
        pickupLat: number | null;
        pickupLng: number | null;
        seats: number;
        status: import(".prisma/client").$Enums.RideRequestStatus;
        assignedDriverId: string | null;
        currentOfferId: string | null;
        clientRequestId: string | null;
        createdAt: Date;
        updatedAt: Date;
        cargoType: import(".prisma/client").$Enums.CargoType;
        departureType: import(".prisma/client").$Enums.DepartureType;
        waitUntilFull: boolean;
    }>;
    arrived(req: Request, id: string): Promise<{
        id: string;
        routeId: string;
        passengerId: string;
        pickupText: string;
        pickupLat: number | null;
        pickupLng: number | null;
        seats: number;
        status: import(".prisma/client").$Enums.RideRequestStatus;
        assignedDriverId: string | null;
        currentOfferId: string | null;
        clientRequestId: string | null;
        createdAt: Date;
        updatedAt: Date;
        cargoType: import(".prisma/client").$Enums.CargoType;
        departureType: import(".prisma/client").$Enums.DepartureType;
        waitUntilFull: boolean;
    }>;
    pickedUpByPassenger(req: Request, id: string): Promise<{
        id: string;
        routeId: string;
        passengerId: string;
        pickupText: string;
        pickupLat: number | null;
        pickupLng: number | null;
        seats: number;
        status: import(".prisma/client").$Enums.RideRequestStatus;
        assignedDriverId: string | null;
        currentOfferId: string | null;
        clientRequestId: string | null;
        createdAt: Date;
        updatedAt: Date;
        cargoType: import(".prisma/client").$Enums.CargoType;
        departureType: import(".prisma/client").$Enums.DepartureType;
        waitUntilFull: boolean;
    }>;
    passengerReady(req: Request, id: string): Promise<{
        ok: boolean;
    }>;
    complete(req: Request, id: string): Promise<{
        ok: boolean;
    }>;
    pickedUpByDriver(req: Request, id: string): Promise<{
        id: string;
        routeId: string;
        passengerId: string;
        pickupText: string;
        pickupLat: number | null;
        pickupLng: number | null;
        seats: number;
        status: import(".prisma/client").$Enums.RideRequestStatus;
        assignedDriverId: string | null;
        currentOfferId: string | null;
        clientRequestId: string | null;
        createdAt: Date;
        updatedAt: Date;
        cargoType: import(".prisma/client").$Enums.CargoType;
        departureType: import(".prisma/client").$Enums.DepartureType;
        waitUntilFull: boolean;
    }>;
    cancel(req: Request, id: string): Promise<{
        id: string;
        routeId: string;
        passengerId: string;
        pickupText: string;
        pickupLat: number | null;
        pickupLng: number | null;
        seats: number;
        status: import(".prisma/client").$Enums.RideRequestStatus;
        assignedDriverId: string | null;
        currentOfferId: string | null;
        clientRequestId: string | null;
        createdAt: Date;
        updatedAt: Date;
        cargoType: import(".prisma/client").$Enums.CargoType;
        departureType: import(".prisma/client").$Enums.DepartureType;
        waitUntilFull: boolean;
    }>;
}
