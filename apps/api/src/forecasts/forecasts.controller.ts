import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ForecastsService } from './forecasts.service';

@ApiTags('forecasts')
@Controller('forecasts')
export class ForecastsController {
  constructor(private readonly svc: ForecastsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.svc.findAll(query);
  }
}
