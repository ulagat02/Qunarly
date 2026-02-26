import { PrismaService } from '../common/prisma.service';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    private audit;
    listOrders(query: Record<string, string>): Promise<{
        items: ({
            seller: {
                id: string;
                displayName: string | null;
            };
            listing: {
                id: string;
                regionId: string | null;
                createdAt: Date;
                districtId: string | null;
                status: import(".prisma/client").$Enums.ProductListingStatus;
                sellerId: string;
                category: string;
                title: string;
                description: string | null;
                quantity: number;
                unit: string;
                priceType: string | null;
                priceMin: number | null;
                priceMax: number | null;
                lat: number | null;
                lng: number | null;
                addressText: string | null;
                currency: string;
                price: number;
                customCategoryName: string | null;
                reservedQty: number;
            } | null;
            buyer: {
                id: string;
                email: string | null;
                displayName: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.OrderStatus;
            sellerId: string;
            quantity: number | null;
            currency: string | null;
            listingId: string | null;
            buyerId: string;
            unitPrice: number | null;
            totalPrice: number | null;
            commerceStatus: import(".prisma/client").$Enums.CommerceOrderStatus;
            payoutJson: import("@prisma/client/runtime/library").JsonValue | null;
            deliveryFee: number | null;
            deliveryOption: string | null;
            destLat: number | null;
            destLng: number | null;
            destinationText: string | null;
            productSubtotal: number | null;
            totalAmount: number | null;
            idempotencyKey: string | null;
        })[];
        nextCursor: string | null;
    }>;
    getOrder(id: string): Promise<{
        order: {
            delivery: ({
                legs: {
                    id: string;
                    createdAt: Date;
                    status: import(".prisma/client").$Enums.DeliveryLegStatus;
                    price: number;
                    sortOrder: number;
                    orderId: string;
                    requestId: string;
                    fromLocation: string;
                    toLocation: string;
                    fromLat: number | null;
                    fromLng: number | null;
                    toLat: number | null;
                    toLng: number | null;
                    driverId: string | null;
                    updatedAt: Date;
                    completedAt: Date | null;
                    deliveryId: string | null;
                    fromHubId: string | null;
                    toHubId: string | null;
                    arrivedHubId: string | null;
                    acceptedAt: Date | null;
                    arrivedAt: Date | null;
                    arrivedLat: number | null;
                    arrivedLng: number | null;
                    handedOffAt: Date | null;
                    startedAt: Date | null;
                }[];
            } & {
                id: string;
                createdAt: Date;
                status: import(".prisma/client").$Enums.DeliveryRequestStatus;
                destLat: number | null;
                destLng: number | null;
                destinationText: string;
                orderId: string;
                originText: string;
                originLat: number | null;
                originLng: number | null;
                distanceKm: number | null;
            }) | null;
            listing: {
                id: string;
                regionId: string | null;
                createdAt: Date;
                districtId: string | null;
                status: import(".prisma/client").$Enums.ProductListingStatus;
                sellerId: string;
                category: string;
                title: string;
                description: string | null;
                quantity: number;
                unit: string;
                priceType: string | null;
                priceMin: number | null;
                priceMax: number | null;
                lat: number | null;
                lng: number | null;
                addressText: string | null;
                currency: string;
                price: number;
                customCategoryName: string | null;
                reservedQty: number;
            } | null;
            legs: {
                id: string;
                createdAt: Date;
                status: import(".prisma/client").$Enums.DeliveryLegStatus;
                price: number;
                sortOrder: number;
                orderId: string;
                requestId: string;
                fromLocation: string;
                toLocation: string;
                fromLat: number | null;
                fromLng: number | null;
                toLat: number | null;
                toLng: number | null;
                driverId: string | null;
                updatedAt: Date;
                completedAt: Date | null;
                deliveryId: string | null;
                fromHubId: string | null;
                toHubId: string | null;
                arrivedHubId: string | null;
                acceptedAt: Date | null;
                arrivedAt: Date | null;
                arrivedLat: number | null;
                arrivedLng: number | null;
                handedOffAt: Date | null;
                startedAt: Date | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.OrderStatus;
            sellerId: string;
            quantity: number | null;
            currency: string | null;
            listingId: string | null;
            buyerId: string;
            unitPrice: number | null;
            totalPrice: number | null;
            commerceStatus: import(".prisma/client").$Enums.CommerceOrderStatus;
            payoutJson: import("@prisma/client/runtime/library").JsonValue | null;
            deliveryFee: number | null;
            deliveryOption: string | null;
            destLat: number | null;
            destLng: number | null;
            destinationText: string | null;
            productSubtotal: number | null;
            totalAmount: number | null;
            idempotencyKey: string | null;
        };
        deliveryRequest: ({
            legs: {
                id: string;
                createdAt: Date;
                status: import(".prisma/client").$Enums.DeliveryLegStatus;
                price: number;
                sortOrder: number;
                orderId: string;
                requestId: string;
                fromLocation: string;
                toLocation: string;
                fromLat: number | null;
                fromLng: number | null;
                toLat: number | null;
                toLng: number | null;
                driverId: string | null;
                updatedAt: Date;
                completedAt: Date | null;
                deliveryId: string | null;
                fromHubId: string | null;
                toHubId: string | null;
                arrivedHubId: string | null;
                acceptedAt: Date | null;
                arrivedAt: Date | null;
                arrivedLat: number | null;
                arrivedLng: number | null;
                handedOffAt: Date | null;
                startedAt: Date | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.DeliveryRequestStatus;
            destLat: number | null;
            destLng: number | null;
            destinationText: string;
            orderId: string;
            originText: string;
            originLat: number | null;
            originLng: number | null;
            distanceKm: number | null;
        }) | null;
        legs: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.DeliveryLegStatus;
            price: number;
            sortOrder: number;
            orderId: string;
            requestId: string;
            fromLocation: string;
            toLocation: string;
            fromLat: number | null;
            fromLng: number | null;
            toLat: number | null;
            toLng: number | null;
            driverId: string | null;
            updatedAt: Date;
            completedAt: Date | null;
            deliveryId: string | null;
            fromHubId: string | null;
            toHubId: string | null;
            arrivedHubId: string | null;
            acceptedAt: Date | null;
            arrivedAt: Date | null;
            arrivedLat: number | null;
            arrivedLng: number | null;
            handedOffAt: Date | null;
            startedAt: Date | null;
        }[];
        proofEvents: never[];
        deliveryReasonStuck: null;
        commissionEntries: never[];
    }>;
    listStuck(): Promise<{
        orderId: string;
        requestId: string;
        legId: string | null;
        legStatus: string;
        driverId: string | null;
        lastUpdatedAt: Date;
        reason: "TIMEOUT" | "WAITING_PROOF" | "LEG2_BLOCKED" | "NO_DRIVER";
    }[]>;
    listDisputes(query: Record<string, string>): Promise<{
        items: {
            id: string;
            createdAt: Date;
            status: import(".prisma/client").$Enums.DisputeStatus;
            orderId: string;
            updatedAt: Date;
            reason: string;
            resolution: import(".prisma/client").$Enums.DisputeResolution | null;
            resolutionNote: string | null;
            openedByUserId: string | null;
            closedByUserId: string | null;
            closedAt: Date | null;
        }[];
    }>;
    getDisputeDetail(id: string): Promise<{
        id: string;
        orderId: string;
        status: import(".prisma/client").$Enums.DisputeStatus;
        reason: string;
        resolution: import(".prisma/client").$Enums.DisputeResolution | null;
        resolutionNote: string | null;
        createdAt: Date;
        updatedAt: Date;
        order: {
            id: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            sellerId: string;
            buyerId: string;
            totalAmount: number | null;
        };
    }>;
    getStats(): Promise<{
        ordersToday: number;
        orders7d: number;
        activeDeliveries: number;
        stuckDeliveries: number;
        commissionToday: number;
        commission7d: number;
        chart7d: {
            date: string;
            orders: number;
            commission: number;
        }[];
    }>;
    listAudit(query: Record<string, string>): Promise<{
        items: {
            id: string;
            action: string;
            metaJson: import("@prisma/client/runtime/library").JsonValue;
            createdAt: Date;
            actor: {
                id: string;
                email: string | null;
                displayName: string | null;
            } | null;
        }[];
        nextCursor: string | null;
    }>;
    listUsers(query: Record<string, string>): Promise<{
        items: {
            id: string;
            createdAt: Date;
            email: string | null;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            status: import(".prisma/client").$Enums.UserStatus;
            displayName: string | null;
        }[];
        nextCursor: string | null;
    }>;
    getUserDetail(id: string): Promise<{
        ordersAsBuyer: number;
        ordersAsSeller: number;
        activeDeliveriesAsDriver: number;
        completedLegsAsDriver: number;
        id: string;
        createdAt: Date;
        email: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
        displayName: string | null;
    }>;
    listAlerts(): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        createdByUserId: string | null;
        updatedAt: Date;
        key: string;
        threshold: number;
    }[]>;
    listPlaybooks(): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        title: string;
        createdByUserId: string | null;
        updatedAt: Date;
        key: string;
        stepsMarkdown: string;
    }[]>;
    listSlas(): Promise<{
        id: string;
        createdAt: Date;
        isActive: boolean;
        createdByUserId: string | null;
        updatedAt: Date;
        legSortOrder: number;
        minutes: number;
    }[]>;
    getInfraHealth(): Promise<{
        activeHubs: number;
        inactiveHubs: number;
        duplicateHubsCount: number;
        activeRoutes: number;
        duplicateRoutesCount: number;
        orphanRoutes: number;
        routeWithInactiveHub: number;
    }>;
    getInfraOrphans(): Promise<never[]>;
    listHubs(): Promise<{
        activeRouteCount: number;
        linkedDeliveryCount: number;
        isDuplicate: boolean;
        duplicateGroupId: null;
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
    }[]>;
    listRoutes(): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.RouteStatus;
        createdByUserId: string | null;
        fromHubId: string;
        toHubId: string;
        autoCreated: boolean;
        pairId: string | null;
        routeType: import(".prisma/client").$Enums.RouteType;
    }[]>;
    listCommissionConfig(): Promise<never[]>;
    listCommissionLedger(): Promise<{
        items: never[];
    }>;
    listCommissionAnomalies(): Promise<{
        items: never[];
    }>;
    listJarmenkeEvents(): Promise<never[]>;
    listAccessList(): Promise<never[]>;
    listFraudSignals(): Promise<never[]>;
    listRateLimits(): Promise<never[]>;
    cancelOrder(orderId: string, userId: string | undefined, reason: string): Promise<{
        ok: boolean;
    }>;
    reassignLeg(legId: string, userId: string | undefined, driverId: string, reason: string): Promise<{
        ok: boolean;
    }>;
    unlockMainline(legId: string, userId: string | undefined, reason: string): Promise<{
        ok: boolean;
    }>;
}
