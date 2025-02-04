import {
  Controller,
  Sse,
  Req,
  UseGuards,
  UseInterceptors,
  Get,
  Patch,
  Param,
  BadRequestException,
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
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('stream')
  @UseInterceptors(SseInterceptor)
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

    const unreadNotifications =
      await this.notificationsService.getUnreadNotifications(userId);

    unreadNotifications.notifications.forEach(notification => {
      this.notificationsService.sendRealTimeNotification(userId, {
        notificationId: notification.notificationId, // 포함된 notificationId
        type: notification.type,
        message: notification.message,
        senderNickname: notification.sender.nickname,
        senderProfileUrl: notification.sender.profileUrl,
      });
    });

    return this.notificationsService.notifications$.asObservable().pipe(
      filter(notification => notification.userId === userId),
      map(notification => ({
        event: 'message',
        data: {
          notificationId: notification.notificationId, // 클라이언트에 전달
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
  @Patch(':notificationId/delete')
  @patchNotificationReadDocs.ApiOperation
  @patchNotificationReadDocs.ApiParam
  @patchNotificationReadDocs.ApiResponse
  async markNotificationAsReadAndDelete(
    @Req() req,
    @Param('notificationId') notificationId: string
  ) {
    const userId = Number(req.user?.user_id);

    const numNotificationId = parseInt(notificationId, 10);
    if (isNaN(numNotificationId)) {
      throw new BadRequestException('유효하지 않은 알림 ID입니다.');
    }

    return this.notificationsService.markNotificationAsRead(
      userId,
      numNotificationId
    );
  }
}
