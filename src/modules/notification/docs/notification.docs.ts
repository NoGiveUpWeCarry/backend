import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export const getUnReadNotificationsDocs = {
  ApiOperation: ApiOperation({
    summary: '읽지 않은 알림 조회',
    description: '읽지 않은 알림을 가져옵니다.',
  }),

  ApiResponse: ApiResponse({
    status: 200,
    description: '읽지 않은 알림 목록',
    schema: {
      example: {
        notifications: [
          {
            notificationId: 1,
            userId: 10,
            senderId: 5,
            type: 'comment',
            message: 'John님이 회원님의 게시물에 댓글을 남겼습니다.',
            isRead: false,
            createdAt: '2025-02-02T12:00:00.000Z',
            sender: {
              nickname: 'John',
              profileUrl: 'https://example.com/profile/john.jpg',
            },
          },
          {
            notificationId: 2,
            userId: 10,
            senderId: 7,
            type: 'like',
            message: 'Jane님이 회원님의 게시물을 좋아합니다.',
            isRead: false,
            createdAt: '2025-02-01T11:00:00.000Z',
            sender: {
              nickname: 'Jane',
              profileUrl: 'https://example.com/profile/jane.jpg',
            },
          },
        ],
      },
    },
  }),
};

export const patchNotificationReadDocs = {
  ApiOperation: ApiOperation({
    summary: '알림 읽음 처리',
    description: '특정 알림을 읽음 처리합니다.',
  }),
  ApiParam: ApiParam({
    name: 'notificationId',
    description: '읽음 처리할 알림 ID',
    type: 'number',
    example: 1,
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '알림 읽음 처리 완료',
    schema: {
      example: {
        notificationId: 1, // ✅ 이름 변경
        isRead: true,
      },
    },
  }),
};
