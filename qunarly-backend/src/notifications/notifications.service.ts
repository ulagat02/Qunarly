import { Injectable, NotFoundException } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class NotificationsService {
  private expo = new Expo();

  constructor(private prisma: PrismaService) {}

  async listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async updateStatus(userId: string, id: string, status?: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }
    if (status === 'DISMISSED' || status === 'READ') {
      return this.prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
    }
    if (status === 'ACTIVE') {
      return this.prisma.notification.update({
        where: { id },
        data: { isRead: false },
      });
    }
    return notification;
  }

  async createForUsers(
    userIds: string[],
    payload: { type: string; title: string; body: string; dataJson?: any },
  ) {
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
    if (!uniqueIds.length) {
      return [];
    }
    const existing = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    const existingIds = existing.map((user) => user.id);
    if (!existingIds.length) {
      return [];
    }
    await this.prisma.notification.createMany({
      data: existingIds.map((userId) => ({
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        dataJson: payload.dataJson ?? undefined,
      })),
    });
    return [];
  }

  async sendPushToUsers(
    userIds: string[],
    payload: { title: string; body: string; data?: Record<string, any> },
  ) {
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
    if (!uniqueIds.length) {
      return;
    }
    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds }, expoPushToken: { not: null } },
      select: { expoPushToken: true },
    });
    const tokens = users.map((user) => user.expoPushToken).filter(Boolean) as string[];
    if (!tokens.length) {
      console.log('[Push] no tokens for users', uniqueIds.length);
      return;
    }
    console.log('[Push] sending', { users: uniqueIds.length, tokens: tokens.length, title: payload.title });
    await this.sendPushToTokens(tokens, payload);
  }

  private async sendPushToTokens(
    tokens: string[],
    payload: { title: string; body: string; data?: Record<string, any> },
  ) {
    const messages: ExpoPushMessage[] = [];
    for (const token of tokens) {
      if (!Expo.isExpoPushToken(token)) {
        continue;
      }
      messages.push({
        to: token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      });
    }
    if (!messages.length) {
      return;
    }
    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        const errors = tickets.filter((ticket) => ticket.status === 'error');
        if (errors.length) {
          console.log('[Push] ticket errors', errors);
        }
      } catch (error) {
        console.log('[Push] send failed', error);
      }
    }
  }

  async updatePushToken(userId: string, token?: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { expoPushToken: token ?? null },
    });
  }
}
