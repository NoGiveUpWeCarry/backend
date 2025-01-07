import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { config } from 'dotenv';
import * as express from 'express';
config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://localhost:5173' | 'https://';
    credentials:true,
  });
  //app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT;
  await app.listen(process.env.PORT);
}
bootstrap();
