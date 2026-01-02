import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
    exposedHeaders: ["X-Transcription", "X-Response-Text"], // Allow frontend to read these headers
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // API prefix
  app.setGlobalPrefix("api");

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("Hospital AI Voice Assistant API")
    .setDescription("AI-powered voice assistant for hospitals with PostgreSQL")
    .setVersion("2.0")
    .addTag("ai", "AI Voice Query endpoints")
    .addTag("beds", "Bed Management")
    .addTag("doctors", "Doctor Management")
    .addTag("appointments", "Appointment Management")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║   🏥 Hospital AI Voice Assistant - NestJS + PostgreSQL   ║
║                                                           ║
║   Server:    http://localhost:${port}                      ║
║   API Docs:  http://localhost:${port}/api/docs            ║
║   Status:    ✅ Running                                   ║
║   Database:  PostgreSQL                                   ║
║                                                           ║
║   Python Services Required:                               ║
║   - Whisper STT: http://localhost:5001                   ║
║   - Coqui TTS:   http://localhost:5002                   ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
