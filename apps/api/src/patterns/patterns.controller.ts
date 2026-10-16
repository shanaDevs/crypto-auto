import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PatternsService } from './patterns.service';

@ApiTags('patterns')
@Controller('patterns')
export class PatternsController {
  constructor(private readonly svc: PatternsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.svc.findAll(query);
  }
}

