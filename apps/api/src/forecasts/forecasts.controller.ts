import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ForecastsService } from './forecasts.service';

@ApiTags('forecasts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('forecasts')
export class ForecastsController {
  constructor(private readonly svc: ForecastsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.svc.findAll(query);
  }
}
