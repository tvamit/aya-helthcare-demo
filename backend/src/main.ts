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
  
  try {
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
  } catch (error: any) {
    if (error.code === 'EADDRINUSE') {
      console.error(`
╔═══════════════════════════════════════════════════════════╗
║   ❌ Port ${port} is already in use!                       ║
╚═══════════════════════════════════════════════════════════╝

To fix this issue, you have the following options:

1. Kill the process using port ${port}:
   lsof -ti:${port} | xargs kill -9

2. Or find and kill manually:
   lsof -i:${port}        # Find the process
   kill -9 <PID>          # Kill using the Process ID

3. Use a different port:
   PORT=3001 npm run start:dev

4. Check if another instance is running:
   ps aux | grep node
      `);
      process.exit(1);
    } else {
      console.error('❌ Error starting server:', error);
      process.exit(1);
    }
  }
}

bootstrap();
