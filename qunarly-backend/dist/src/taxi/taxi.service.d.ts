import { PrismaService } from '../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { JoinQueueDto } from './dto/join-queue.dto';
import { CreateRouteDto } from './dto/create-route.dto';
import { EnsureRouteDto } from './dto/ensure-route.dto';
export declare class TaxiService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    listRoutes(fromHubId?: string, toHubId?: string, mode?: 'passenger' | 'driver'): Promise<({
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
    ensureRoute(userId: string, dto: EnsureRouteDto): Promise<({
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
    getQueueStatus(driverId: string, routeId: string): Promise<{
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
    }>;
    listPendingOffers(driverId: string): Promise<({
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
    listQueueDrivers(routeId: string): Promise<{
        driverId: string;
        displayName: string;
        phone: string | null;
        avatarUrl: string | null;
        status: import(".prisma/client").$Enums.DriverQueueStatus;
        availableSeats: number;
        capacity: number;
        joinedAt: Date;
    }[]>;
    listQueuePassengers(driverId: string, routeId: string, expireMinutes?: number): Promise<{
        id: string;
        userId: string;
        displayName: string;
        avatarUrl: string | null;
        seatsRequested: number;
        pickupLabel: string;
        departLabel: string;
        status: import(".prisma/client").$Enums.RideRequestStatus;
    }[]>;
    markQueueOnTheWay(driverId: string, routeId: string): Promise<{
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
    markQueueInactive(driverId: string, routeId: string): Promise<{
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
    confirmQueuePassenger(driverId: string, requestId: string): Promise<{
        ok: boolean;
    }>;
    skipQueuePassenger(driverId: string, requestId: string): Promise<{
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
    removeConfirmedPassenger(driverId: string, requestId: string, reason: 'REMOVED_BY_DRIVER' | 'NO_SHOW'): Promise<{
        ok: boolean;
    }>;
    joinQueue(driverId: string, dto: JoinQueueDto): Promise<{
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
    pingQueue(driverId: string, routeId: string): Promise<{
        ok: boolean;
        expiresAt: Date;
    }>;
    private logQueueEvent;
    expireQueueEntriesAndOffers(): Promise<void>;
    createRequest(passengerId: string, dto: CreateRideRequestDto): Promise<{
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
    acceptOffer(offerId: string, driverId: string, actionId?: string): Promise<object>;
    rejectOffer(offerId: string, driverId: string): Promise<{
        ok: boolean;
    }>;
    markOnTheWay(requestId: string, driverId: string): Promise<{
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
    markArrived(requestId: string, driverId: string): Promise<{
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
    markPickedUpByPassenger(requestId: string, passengerId: string): Promise<{
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
    markPickedUpByDriver(requestId: string, driverId: string): Promise<{
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
    markPassengerReady(requestId: string, passengerId: string): Promise<{
        ok: boolean;
    }>;
    getActiveDriverRequest(driverId: string): Promise<({
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
    completeRequest(requestId: string, driverId: string): Promise<{
        ok: boolean;
    }>;
    cancelRequest(requestId: string, passengerId: string): Promise<{
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
    private expireConfirmedRequests;
    private getActiveSeatCount;
    private ensureSeatsAvailable;
    private syncQueueSeats;
    private dispatchOffer;
}
