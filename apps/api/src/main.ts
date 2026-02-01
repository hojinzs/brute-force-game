import { NestFactory } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { getCorsOrigin } from './shared/utils/cors.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigin = getCorsOrigin(origin);
      if (allowedOrigin === '*') {
        callback(null, true);
      } else if (allowedOrigin) {
        callback(null, allowedOrigin);
      } else {
        callback(new ForbiddenException('Not allowed by CORS'));
      }
    },
    // credentials: true,
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Brute Force Game API')
    .setDescription('Social hacking simulation where global users compete to crack AI-generated passwords')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
