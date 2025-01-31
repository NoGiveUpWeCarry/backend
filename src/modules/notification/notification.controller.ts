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
    const userId = req.user?.user_id;

    if (!userId) {
      console.error('사용자 인증 정보가 필요합니다.');
      return of({
        type: 'error',
        message: '사용자 인증 정보가 필요합니다.',
        timestamp: new Date().toISOString(),
      });
    }

    req.on('close', () => {
      console.log(`사용자 ${userId}와의 SSE 연결이 종료되었습니다.`);
      // 필요시 리소스 정리 로직 추가
    });

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
