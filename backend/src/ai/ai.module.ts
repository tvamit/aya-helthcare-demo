import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { BedsModule } from '../beds/beds.module';
import { DoctorsModule } from '../doctors/doctors.module';

@Module({
  imports: [BedsModule, DoctorsModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
