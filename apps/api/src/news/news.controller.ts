import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NewsService } from './news.service';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private readonly svc: NewsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.svc.findAll(query);
  }
}
