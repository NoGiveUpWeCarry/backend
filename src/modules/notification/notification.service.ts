import { Injectable } from '@nestjs/common';
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
}
