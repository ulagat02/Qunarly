import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';
import { Request } from 'express';
import { FileEntityType } from '@prisma/client';
export declare class FilesController {
    private filesService;
    constructor(filesService: FilesService);
    create(req: Request, dto: CreateFileDto): Promise<{
        id: string;
        createdAt: Date;
        url: string;
        ownerId: string;
        type: string;
        metaJson: import("@prisma/client/runtime/library").JsonValue | null;
        entityId: string | null;
        entityType: import(".prisma/client").$Enums.FileEntityType | null;
    }>;
    upload(req: Request, entityType?: FileEntityType): Promise<{
        id: string;
        createdAt: Date;
        url: string;
        ownerId: string;
        type: string;
        metaJson: import("@prisma/client/runtime/library").JsonValue | null;
        entityId: string | null;
        entityType: import(".prisma/client").$Enums.FileEntityType | null;
    }>;
}
