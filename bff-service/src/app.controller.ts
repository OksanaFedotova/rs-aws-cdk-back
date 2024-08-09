import { Controller, All, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Request, Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @All('/*')
  handleRequest(@Req() req: Request, @Res() res: Response) {
    return this.appService.handleRequest(req, res);
  }
}
