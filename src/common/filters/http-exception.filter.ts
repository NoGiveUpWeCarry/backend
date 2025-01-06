import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch() // 모든 예외를 잡도록 설정
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // HTTP 예외인지 확인
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 에러 메시지 추출
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : '서버 내부의 에러입니다';

    response.status(status).json({
      statusCode: status,
      message: typeof message === 'string' ? message : (message as any).message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
