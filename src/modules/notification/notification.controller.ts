import {
  Controller,
  Sse,
  Req,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notification.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Sse('stream')
  @UseGuards(JwtAuthGuard)
  streamNotifications(@Req() req): Observable<any> {
    const userId = req.user?.user_id; // 인증된 사용자 ID 가져오기

    // 인증된 사용자 확인
    if (!userId) {
      // 에러를 발생시키되 기본 Observable을 반환
      console.error('사용자 인증 정보가 필요합니다.');
      return of({
        type: 'error',
        message: '사용자 인증 정보가 필요합니다.',
        timestamp: new Date().toISOString(),
      });
    }

    // 사용자별 필터링된 알림 스트림 반환
    return this.notificationsService.notifications$.asObservable().pipe(
      filter(notification => notification.userId === userId),
      map(notification => ({
        type: notification.type,
        message: notification.message,
        senderNickname: notification.senderNickname,
        senderProfileUrl: notification.senderProfileUrl,
        timestamp: new Date().toISOString(),
      }))
    );
  }
}
