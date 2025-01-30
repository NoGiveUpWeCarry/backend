import { Injectable } from '@nestjs/common';
import { NotificationsController } from '@src/modules/notification/notification.controller';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsController: NotificationsController
  ) {}

  sendEvent(userId: number, eventType: string, payload: any) {
    const notification = {
      userId,
      eventType,
      payload,
      timestamp: new Date(),
    };
    this.notificationsController.sendNotification(notification);
  }
}
