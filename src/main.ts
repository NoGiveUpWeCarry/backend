import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { config } from 'dotenv';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:8080',
      'https://p-a-d.store',
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], // 💡 GET 포함
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'], // 💡 CORS 요청 헤더 허용
    exposedHeaders: ['Authorization'], // 💡 클라이언트에서 응답 헤더 사용 가능
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  const config = new DocumentBuilder()
    .setTitle('PAD API')
    .setDescription('PAD를 위한 REST API 문서입니다.')
    .setVersion('1.0')
    .addBearerAuth() // JWT 인증 추가
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      url: '/api-docs', // Swagger 문서 경로와 맞추기 위해 설정
    },
    customSiteTitle: 'API 문서',
  });

  //app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT);
}
bootstrap();
