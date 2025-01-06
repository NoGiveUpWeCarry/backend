import { Controller, Get, HttpStatus, HttpException } from '@nestjs/common';
import { AppService } from '@src/app.service';
import { ERROR_MESSAGES } from '@common/constants/error-messages';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-error')
  testError() {
    throw new HttpException(
      ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
