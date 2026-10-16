import { Module } from '@nestjs/common';
import { PatternsController } from './patterns.controller';
import { PatternsService } from './patterns.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PatternsController],
  providers: [PatternsService],
  exports: [PatternsService],
})
export class PatternsModule {}
