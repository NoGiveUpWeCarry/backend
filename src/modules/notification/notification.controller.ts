import {
  Controller,
  Sse,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notification.service';
import { SseInterceptor } from './Interceptors/notification.interceptor'; // ✅ 추가

@Controller('notifications')
@UseInterceptors(SseInterceptor) // ✅ Interceptor 사용
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('stream')
  @UseGuards(JwtAuthGuard)
  streamNotifications(@Req() req): Observable<any> {
    const userId = req.user?.user_id;

    if (!userId) {
      console.error('🚨 사용자 인증 정보가 필요합니다.');
      return of({
        type: 'error',
        message: '사용자 인증 정보가 필요합니다.',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`✅ SSE 연결 성공 - 사용자 ${userId}`);

    req.on('close', () => {
      console.log(`❌ 사용자 ${userId}와의 SSE 연결 종료`);
    });

    return this.notificationsService.notifications$.asObservable().pipe(
      filter(notification => notification.userId === userId),
      map(notification => {
        console.log('📡 SSE 이벤트 전송:', notification);
        return {
          type: notification.type,
          message: notification.message,
          senderNickname: notification.senderNickname,
          senderProfileUrl: notification.senderProfileUrl,
          timestamp: new Date().toISOString(),
        };
      })
    );
  }
}
