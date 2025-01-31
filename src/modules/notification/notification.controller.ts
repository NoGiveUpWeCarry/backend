import { Controller, Sse, Req } from '@nestjs/common';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { NotificationsService } from './notification.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('stream')
  streamNotifications(@Req() req): Observable<any> {
    const userId = req.user?.user_id; // 인증된 사용자 ID 가져오기

    if (!userId) {
      throw new Error('사용자 인증 정보가 필요합니다.');
    }

    return this.notificationsService.notifications$.asObservable().pipe(
      filter(notification => notification.userId === userId),
      map(notification => ({
        type: notification.type,
        message: notification.message,
        senderNickname: notification.senderNickname,
        senderProfileUrl: notification.senderProfileUrl,
        timestamp: new Date().toISOString(), // 알림 전송 시간 추가
      }))
    );
  }
}
