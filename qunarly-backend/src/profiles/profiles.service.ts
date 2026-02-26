import { BadRequestException, Injectable } from '@nestjs/common';
import { FileEntityType } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { FilesService } from '../files/files.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService, private filesService: FilesService) {}

  async getByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { avatarFile: true },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { region: true, district: true, settlement: true },
    });
    if (!profile && !user) {
      return null;
    }
    const settlementName = user?.settlement?.nameDisplay ?? null;
    const resolvedDisplayName = user?.displayName ?? profile?.name ?? '';
    const resolvedAvatarUrl = user?.avatarUrl ?? profile?.avatarFile?.url ?? null;
    return {
      firstName: profile?.name ?? '',
      displayName: resolvedDisplayName,
      phone: user?.phone ?? null,
      regionId: user?.regionId ?? profile?.regionId ?? null,
      regionName: user?.region?.name ?? null,
      districtId: user?.districtId ?? null,
      districtName: user?.district?.name ?? null,
      settlementId: user?.settlementId ?? null,
      settlementName,
      addressText: user?.homeAddressText ?? null,
      lat: user?.homeLat ?? null,
      lng: user?.homeLng ?? null,
      homeUpdatedAt: user?.homeUpdatedAt ?? null,
      farmName: profile?.farmName ?? null,
      avatarUrl: resolvedAvatarUrl,
      bio: user?.bio ?? null,
      publicProfile: user?.publicProfile ?? true,
      ratingStats: user?.ratingStats ?? null,
    };
  }

  async upsertProfile(userId: string, dto: UpdateProfileDto) {
    const {
      firstName,
      name,
      displayName,
      bio,
      publicProfile,
      phone,
      avatarFileId,
      avatarUrl,
      regionId,
      districtId,
      settlementId,
      addressText,
      lat,
      lng,
      homeAddressText,
      homeRegion,
      homeLat,
      homeLng,
      ...rest
    } = dto;
    const resolvedAddressText = addressText ?? homeAddressText;
    const resolvedLat = lat ?? homeLat;
    const resolvedLng = lng ?? homeLng;
    const resolvedName = firstName ?? name;
    if (phone !== undefined || displayName !== undefined || bio !== undefined || publicProfile !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(phone !== undefined ? { phone } : {}),
          ...(displayName !== undefined ? { displayName } : {}),
          ...(bio !== undefined ? { bio } : {}),
          ...(publicProfile !== undefined ? { publicProfile } : {}),
        },
      });
    }
    if (regionId || districtId || settlementId) {
      const region = regionId
        ? await this.prisma.region.findUnique({ where: { id: regionId } })
        : null;
      const district = districtId
        ? await this.prisma.district.findUnique({ where: { id: districtId } })
        : null;
      const settlement = settlementId
        ? await this.prisma.communityVillage.findUnique({ where: { id: settlementId } })
        : null;
      if (regionId && !region) {
        throw new BadRequestException('Region not found');
      }
      if (districtId && !district) {
        throw new BadRequestException('District not found');
      }
      if (regionId && districtId && district?.regionId !== regionId) {
        throw new BadRequestException('District does not belong to region');
      }
      if (settlementId && !settlement) {
        throw new BadRequestException('Settlement not found');
      }
      if (settlementId && districtId && settlement?.districtId !== districtId) {
        throw new BadRequestException('Settlement does not belong to district');
      }
    }
    if (
      regionId !== undefined ||
      districtId !== undefined ||
      settlementId !== undefined
    ) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          regionId: regionId ?? undefined,
          districtId: districtId ?? undefined,
          settlementId: settlementId ?? undefined,
        },
      });
    }
    if (
      resolvedAddressText !== undefined ||
      resolvedLat !== undefined ||
      resolvedLng !== undefined ||
      homeRegion !== undefined
    ) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          homeAddressText: resolvedAddressText ?? undefined,
          homeRegion: homeRegion ?? undefined,
          homeLat: resolvedLat ?? undefined,
          homeLng: resolvedLng ?? undefined,
          homeUpdatedAt: new Date(),
        },
      });
    }
    let resolvedAvatarFileId = avatarFileId;
    if (avatarFileId) {
      const file = await this.prisma.file.findUnique({ where: { id: avatarFileId } });
      if (!file || file.ownerId !== userId) {
        throw new BadRequestException('Avatar file not found');
      }
    } else if (avatarUrl) {
      const created = await this.prisma.file.create({
        data: {
          ownerId: userId,
          type: 'image/url',
          url: avatarUrl,
          entityType: FileEntityType.PROFILE_AVATAR,
          entityId: userId,
        },
      });
      resolvedAvatarFileId = created.id;
    }
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      update: {
        ...rest,
        ...(resolvedName ? { name: resolvedName } : {}),
        ...(resolvedAvatarFileId ? { avatarFileId: resolvedAvatarFileId } : {}),
        ...(regionId ? { regionId } : {}),
      },
      create: {
        userId,
        name: resolvedName || 'Unnamed',
        ...rest,
        ...(resolvedAvatarFileId ? { avatarFileId: resolvedAvatarFileId } : {}),
        ...(regionId ? { regionId } : {}),
      },
    });
    if (resolvedAvatarFileId) {
      await this.prisma.file.update({
        where: { id: resolvedAvatarFileId },
        data: { entityType: FileEntityType.PROFILE_AVATAR, entityId: userId },
      });
      const file = await this.prisma.file.findUnique({ where: { id: resolvedAvatarFileId } });
      if (file?.url) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { avatarUrl: file.url },
        });
      }
    }
    const avatarFile = resolvedAvatarFileId
      ? await this.prisma.file.findUnique({ where: { id: resolvedAvatarFileId } })
      : null;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { region: true, district: true, settlement: true },
    });
    const settlementName = user?.settlement?.nameDisplay ?? null;
    const resolvedDisplayName = user?.displayName ?? profile.name ?? '';
    return {
      firstName: profile.name,
      displayName: resolvedDisplayName,
      phone: user?.phone ?? null,
      regionId: user?.regionId ?? profile.regionId ?? null,
      regionName: user?.region?.name ?? null,
      districtId: user?.districtId ?? null,
      districtName: user?.district?.name ?? null,
      settlementId: user?.settlementId ?? null,
      settlementName,
      addressText: user?.homeAddressText ?? null,
      lat: user?.homeLat ?? null,
      lng: user?.homeLng ?? null,
      homeUpdatedAt: user?.homeUpdatedAt ?? null,
      farmName: profile.farmName ?? null,
      avatarUrl: user?.avatarUrl ?? avatarFile?.url ?? null,
      bio: user?.bio ?? null,
      publicProfile: user?.publicProfile ?? true,
      ratingStats: user?.ratingStats ?? null,
    };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File, baseUrl?: string) {
    const created = await this.filesService.createUploadedFile(
      userId,
      file,
      FileEntityType.PROFILE_AVATAR,
      userId,
      baseUrl,
    );
    await this.prisma.profile.upsert({
      where: { userId },
      update: { avatarFileId: created.id },
      create: { userId, name: 'Unnamed', avatarFileId: created.id },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: created.url },
    });
    return this.getByUserId(userId);
  }
}
