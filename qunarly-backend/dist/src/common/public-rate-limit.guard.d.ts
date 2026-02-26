import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class PublicRateLimitGuard implements CanActivate {
    private readonly windowMs;
    private readonly maxRequests;
    private readonly store;
    canActivate(context: ExecutionContext): boolean;
}
