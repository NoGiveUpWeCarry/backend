import { Controller, Sse } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

@Controller('notifications')
export class NotificationsController {
  private notifications$ = new Subject<MessageEvent>();

  @Sse()
  streamNotifications(): Observable<MessageEvent> {
    return this.notifications$.asObservable();
  }

  sendNotification(data: any) {
    this.notifications$.next(data);
  }
}
