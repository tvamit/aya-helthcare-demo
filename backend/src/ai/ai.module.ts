import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { BedsModule } from '../beds/beds.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { VectorStoreService } from './vector-store.service';
import { DocumentProcessorService } from './document-processor.service';
import { KnowledgeLoaderService } from './knowledge-loader.service';

@Module({
  imports: [BedsModule, DoctorsModule, AppointmentsModule],
  controllers: [AiController],
  providers: [
    AiService,
    VectorStoreService,
    DocumentProcessorService,
    KnowledgeLoaderService,
  ],
})
export class AiModule {}
