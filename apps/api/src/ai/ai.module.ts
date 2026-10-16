import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { OpenAIProvider } from './openai.provider';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [OpenAIProvider, AiService],
  exports: [AiService, OpenAIProvider],
})
export class AiModule {}
