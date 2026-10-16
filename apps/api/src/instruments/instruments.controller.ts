import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InstrumentsService } from './instruments.service';

@ApiTags('instruments')
@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly svc: InstrumentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all active instruments' })
  findAll(@Query('all') all?: string) {
    return this.svc.findAll(all !== 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get instrument by ID' })
  findOne(@Param('id') id: string) {
    return this.svc.findById(id);
  }
}
