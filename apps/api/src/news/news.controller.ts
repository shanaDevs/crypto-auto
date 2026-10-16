import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NewsService } from './news.service';

@ApiTags('news')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('news')
export class NewsController {
  constructor(private readonly svc: NewsService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.svc.findAll(query);
  }
}
