// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '@src/prisma/prisma.service';
// import { Subject } from 'rxjs';

// @Injectable()
// export class NotificationsService {
//   constructor(private readonly prisma: PrismaService) {}

//   // 특정 사용자 알림 조회
//   async getNotificationsForUser(userId: number, isRead?: boolean) {
//     return this.prisma.notification.findMany({
//       where: {
//         userId,
//         ...(isRead !== undefined && { isRead }),
//       },
//       orderBy: { createdAt: 'desc' },
//     });
//   }

//   // 알림 생성
//   async createNotification(userId: number, type: string, message: string) {
//     return this.prisma.notification.create({
//       data: { userId, type, message },
//     });
//   }

//   // 알림 읽음 처리
//   async markAsRead(notificationId: number) {
//     return this.prisma.notification.update({
//       where: { id: notificationId },
//       data: { isRead: true },
//     });
//   }

//   // SSE 알림 전송
//   async sendRealTimeNotification(
//     userId: number,
//     data: any,
//     notifications$: Subject<any>
//   ) {
//     const notification = await this.createNotification(
//       userId,
//       data.type,
//       data.message
//     );
//     notifications$.next({ data: notification, type: 'notification' });
//   }
// }
