import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly cls: ClsService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();

    this.$use(async (params, next) => {
      let collegeId: string | undefined;
      // Depending on context, cls might not be active (e.g. system jobs), catch error if any.
      try {
        collegeId = this.cls.isActive() ? this.cls.get('collegeId') : undefined;
      } catch (e) {}

      const modelsWithCollegeId = [
        'User', 'Club', 'Event', 'Registration', 'Sponsor', 
        'Transaction', 'Task', 'Invitation', 'ClubMember', 'CollegeConfig',
        'CollegeContract', 'BlockchainActivity'
      ];

      if (collegeId && params.model && modelsWithCollegeId.includes(params.model)) {
        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.action = 'findFirst';
          params.args = params.args || {};
          params.args.where = { ...params.args.where, collegeId };
        }
        else if (params.action === 'findMany') {
          params.args = params.args || {};
          params.args.where = { ...params.args.where, collegeId };
        }
        else if (params.action === 'updateMany' || params.action === 'deleteMany') {
          params.args = params.args || {};
          params.args.where = { ...params.args.where, collegeId };
        }
        else if (params.action === 'create') {
          params.args = params.args || {};
          params.args.data = { ...params.args.data, collegeId };
        }
        else if (params.action === 'createMany') {
          params.args = params.args || {};
          if (Array.isArray(params.args.data)) {
            params.args.data = params.args.data.map((d: any) => ({ ...d, collegeId }));
          } else {
            params.args.data = { ...params.args.data, collegeId };
          }
        }
      }

      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
