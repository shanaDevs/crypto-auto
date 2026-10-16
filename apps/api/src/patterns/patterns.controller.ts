import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PatternsService } from './patterns.service';

@ApiTags('patterns')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('patterns')
export class PatternsController {
  constructor(private readonly svc: PatternsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.svc.findAll(query);
  }
}
