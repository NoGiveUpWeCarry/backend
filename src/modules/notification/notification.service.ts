import { Injectable } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '@src/prisma/prisma.service';
import { Subject } from 'rxjs';

@Injectable()
export class NotificationsService {
  public readonly notifications$ = new Subject<any>();

  constructor(private readonly prisma: PrismaService) {}

  // 알림 생성
  async createNotification(
    userId: number,
    senderId: number,
    type: string,
    message: string
  ) {
    try {
      return await this.prisma.notification.create({
        data: {
          userId,
          senderId,
          type,
          message,
        },
      });
    } catch (error) {
      console.error('알림 생성 중 오류:', error.message);
      throw new Error('알림 생성에 실패했습니다.');
    }
  }

  // 실시간 알림 전송
  sendRealTimeNotification(userId: number, data: any) {
    this.notifications$.next({
      userId,
      type: data.type || 'notification', // 이벤트 유형
      message: data.message, // 알림 메시지
      senderNickname: data.senderNickname, // 보낸 사람 닉네임
      senderProfileUrl: data.senderProfileUrl, // 보낸 사람 프로필 URL
      timestamp: new Date().toISOString(), // 알림 전송 시간
    });
  }

  async getUnreadNotifications(userId: number) {
    console.log(`🔍 [getUnreadNotifications] 시작 - userId: ${userId}`);

    // 1. 읽지 않은 알림 조회
    const unreadNotifications = await this.prisma.notification.findMany({
      where: {
        userId: userId,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            nickname: true,
            profile_url: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(
      '📥 [getUnreadNotifications] DB 조회 결과:',
      unreadNotifications
    );

    // 2. 데이터를 변환하여 반환
    const transformedNotifications = unreadNotifications.map(notification => {
      const transformedNotification = {
        notificationId: notification.id, // `id`를 `notificationId`로 변경
        userId: notification.userId,
        senderId: notification.senderId,
        type: notification.type,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        sender: {
          nickname: notification.sender.nickname,
          profileUrl: notification.sender.profile_url, // `profile_url` -> `profileUrl`
        },
      };

      console.log(
        '🔧 [getUnreadNotifications] 변환된 알림:',
        transformedNotification
      );
      return transformedNotification;
    });

    console.log('📤 [getUnreadNotifications] 최종 반환 데이터:', {
      notifications: transformedNotifications,
    });

    return {
      notifications: transformedNotifications,
    };
  }

  async markNotificationAsRead(userId: number, notificationId: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('알림을 찾을 수 없습니다.');
    }

    if (notification.userId !== userId) {
      throw new Error('본인의 알림만 읽음 처리할 수 있습니다.');
    }

    const updatedNotification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return {
      notificationId: updatedNotification.id, // 필드 이름 변경
      isRead: updatedNotification.isRead,
    };
  }
}
