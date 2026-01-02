import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  Res,
  Header,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from "@nestjs/swagger";
import { Response } from "express";
import { diskStorage } from "multer";
import * as fs from "fs";
import { AiService } from "./ai.service";

@ApiTags("ai")
@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("voice-query")
  @ApiOperation({
    summary: "Process voice query - send audio, get audio response",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        audio: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor("audio", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + "-" + Math.round(Math.random() * 1e9);
          cb(null, `audio-${uniqueSuffix}.wav`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("audio/")) {
          cb(null, true);
        } else {
          cb(
            new HttpException(
              "Only audio files allowed",
              HttpStatus.BAD_REQUEST
            ),
            false
          );
        }
      },
    })
  )
  async handleVoiceQuery(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response
  ) {
    if (!file) {
      throw new HttpException("No audio file provided", HttpStatus.BAD_REQUEST);
    }

    try {
      console.log("🎤 Received audio file:", file.filename);

      // Step 1: Convert Speech to Text
      const transcription = await this.aiService.speechToText(file.path);
      console.log("📝 Transcription:", transcription);

      // Step 2: Process query with AI + Database
      const aiResponse = await this.aiService.processQuery(transcription);
      console.log("🤖 AI Response:", aiResponse);

      // Step 3: Convert Text to Speech
      const audioStream = await this.aiService.textToSpeech(aiResponse);

      // Step 4: Send audio response with headers
      res.setHeader("Content-Type", "audio/wav");
      res.setHeader("X-Transcription", encodeURIComponent(transcription));
      res.setHeader("X-Response-Text", encodeURIComponent(aiResponse));

      audioStream.pipe(res);
    } catch (error) {
      console.error("❌ Error:", error.message);
      throw new HttpException(
        error.message || "Failed to process voice query",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    } finally {
      // Cleanup uploaded file
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }

  @Post("text-query")
  @ApiOperation({ summary: "Process text query - for testing without voice" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          example: "ICU mein bed available hai kya?",
        },
      },
    },
  })
  async handleTextQuery(@Body() body: { query: string }) {
    if (!body.query) {
      throw new HttpException("No query provided", HttpStatus.BAD_REQUEST);
    }

    console.log("📝 Text Query:", body.query);

    try {
      const response = await this.aiService.processQuery(body.query);
      console.log("🤖 Response:", response);

      return {
        success: true,
        query: body.query,
        response,
      };
    } catch (error) {
      throw new HttpException(
        error.message || "Failed to process query",
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post("health")
  @ApiOperation({ summary: "Health check for AI services" })
  async healthCheck() {
    // Test connection to Python services
    return {
      success: true,
      service: "AI Module",
      whisperUrl: process.env.WHISPER_SERVICE_URL,
      ttsUrl: process.env.TTS_SERVICE_URL,
      groqConfigured: !!process.env.GROQ_API_KEY,
    };
  }
}
