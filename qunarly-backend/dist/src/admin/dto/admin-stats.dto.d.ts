export declare class AdminStatsDayDto {
    day: string;
    orders: number;
    deliveries: number;
    stuck: number;
}
export declare class AdminStatsDto {
    ordersToday: number;
    orders7d: number;
    activeDeliveries: number;
    stuckDeliveries: number;
    commissionToday: number;
    commission7d: number;
    chart7d: AdminStatsDayDto[];
}
