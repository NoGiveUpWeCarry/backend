// import { Controller, Get, Sse, Param, Patch, Body, Req } from '@nestjs/common';
// import { Observable, Subject } from 'rxjs';
// import { map } from 'rxjs/operators';
// import { NotificationsService } from './notification.service';

// @Controller('notifications')
// export class NotificationsController {
//   private notifications$ = new Subject<MessageEvent>();

//   constructor(private readonly notificationService: NotificationsService) {}

//   // SSE 스트림
//   @Sse('stream')
//   streamNotifications(@Req() req: any): Observable<any> {
//     req.on('close', () => {
//       console.log('클라이언트 연결 종료');
//     });

//     return this.notifications$.asObservable().pipe(
//       map(data => ({
//         data,
//         type: 'notification',
//       }))
//     );
//   }

//   // 알림 전송 메서드
//   sendNotification(data: any) {
//     this.notifications$.next(data);
//   }
//   // 특정 사용자의 알림 조회
//   @Get()
//   async getUserNotifications(@Req() req: any) {
//     const userId = req.user.user_id; // 인증된 사용자 정보에서 ID 가져오기
//     if (!userId) {
//       throw new Error('사용자 ID를 찾을 수 없습니다.');
//     }

//     return this.notificationService.getNotificationsForUser(userId);
//   }

//   // 알림 읽음 처리
//   @Patch(':id/read')
//   async markNotificationAsRead(@Param('id') notificationId: number) {
//     return await this.notificationService.markAsRead(notificationId);
//   }
// }
