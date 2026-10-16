import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InstrumentsService } from './instruments.service';

@ApiTags('instruments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
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
