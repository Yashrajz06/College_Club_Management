import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { CollegesService } from './colleges.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('colleges')
export class CollegesController {
  constructor(private readonly collegesService: CollegesService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: any) {
    return this.collegesService.register(dto);
  }

  @Get()
  async findAll() {
    return this.collegesService.findAll();
  }
}
