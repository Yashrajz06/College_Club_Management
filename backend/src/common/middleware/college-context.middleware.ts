import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class CollegeContextMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const collegeId = req.headers['x-college-id'] as string;
    
    if (collegeId) {
      this.cls.set('collegeId', collegeId);
    }
    
    next();
  }
}
