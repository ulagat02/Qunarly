import { PrismaClient } from '@prisma/client';
type ParsedRow = {
    regionName: string;
    districtName: string;
    settlementName: string;
};
export declare const loadAdminUnits: (filePath: string) => ParsedRow[];
export declare const importAdminUnits: (prisma: PrismaClient, filePath: string) => Promise<void>;
export declare const resolveAdminUnitsFile: (baseDir: string) => string;
export {};
