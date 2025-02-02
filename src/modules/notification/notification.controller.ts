import {
  Controller,
  Sse,
  Req,
  UseGuards,
  UseInterceptors,
  Get,
  Patch,
  Param,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notification.service';
import { SseInterceptor } from './Interceptors/notification.interceptor';
import { ApiBearerAuth } from '@nestjs/swagger';
import {
  getUnReadNotificationsDocs,
  patchNotificationReadDocs,
} from './docs/notification.docs';

@Controller('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(SseInterceptor)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('stream')
  async streamNotifications(@Req() req): Promise<Observable<any>> {
    const userId = req.user?.user_id;

    if (!userId) {
      console.error('🚨 사용자 인증 정보가 필요합니다.');
      return of({
        event: 'error',
        data: {
          type: 'error',
          message: '사용자 인증 정보가 필요합니다.',
          timestamp: new Date().toISOString(),
        },
      });
    }

    console.log(`✅ SSE 연결 성공 - 사용자 ${userId}`);

    req.on('close', () => {
      console.log(`❌ 사용자 ${userId}와의 SSE 연결 종료`);
    });

    // 🔹 SSE 연결 시 기존 읽지 않은 알림 전송
    const unreadNotifications =
      await this.notificationsService.getUnreadNotifications(userId);

    // ✅ notifications 배열로 접근
    unreadNotifications.notifications.forEach(notification => {
      this.notificationsService.sendRealTimeNotification(userId, {
        type: notification.type,
        message: notification.message,
        senderNickname: notification.sender.nickname,
        senderProfileUrl: notification.sender.profileUrl,
      });
    });

    return this.notificationsService.notifications$.asObservable().pipe(
      filter(notification => notification.userId === userId),
      map(notification => ({
        event: 'message', // ✅ 'message' 이벤트 설정
        data: {
          notificationId: notification.id,
          type: notification.type,
          message: notification.message,
          senderNickname: notification.senderNickname,
          senderProfileUrl: notification.senderProfileUrl,
          timestamp: new Date().toISOString(),
        },
      }))
    );
  }

  @Get('unread')
  @getUnReadNotificationsDocs.ApiOperation
  @getUnReadNotificationsDocs.ApiResponse
  async getUnreadNotifications(@Req() req) {
    const userId = req.user?.user_id;
    return this.notificationsService.getUnreadNotifications(userId);
  }

  // 특정 알림을 읽음 상태로 변경
  @Patch(':notificationId/read')
  @patchNotificationReadDocs.ApiOperation
  @patchNotificationReadDocs.ApiParam
  @patchNotificationReadDocs.ApiResponse
  async markNotificationAsRead(
    @Req() req,
    @Param('notificationId') notificationId: string
  ) {
    const userId = req.user?.user_id;
    const numNotificationId = parseInt(notificationId, 10);
    return this.notificationsService.markNotificationAsRead(
      userId,
      numNotificationId
    );
  }
}
