import { FileEntityType, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { CreateFileDto } from './dto/create-file.dto';
export declare class FilesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(ownerId: string, dto: CreateFileDto): Promise<{
        id: string;
        createdAt: Date;
        url: string;
        ownerId: string;
        type: string;
        metaJson: Prisma.JsonValue | null;
        entityId: string | null;
        entityType: import(".prisma/client").$Enums.FileEntityType | null;
    }>;
    createUploadedFile(ownerId: string, file: Express.Multer.File, entityType?: FileEntityType, entityId?: string, baseUrl?: string): Promise<{
        id: string;
        createdAt: Date;
        url: string;
        ownerId: string;
        type: string;
        metaJson: Prisma.JsonValue | null;
        entityId: string | null;
        entityType: import(".prisma/client").$Enums.FileEntityType | null;
    }>;
}
