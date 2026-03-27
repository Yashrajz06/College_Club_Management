import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Controller('theming')
export class ThemingController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public: Get college branding info.
   */
  @Public()
  @Get(':collegeId')
  async getTheming(@Param('collegeId') collegeId: string) {
    const college = await this.prisma.college.findUnique({
      where: { id: collegeId },
      select: { id: true, name: true, domain: true },
    });

    if (!college) {
      throw new NotFoundException('College not found.');
    }

    const config = await this.prisma.collegeConfig.findFirst({
      where: { collegeId },
      select: {
        brandingColor: true,
        brandingLogo: true,
      },
    });

    return {
      collegeId: college.id,
      collegeName: college.name,
      domain: college.domain,
      brandingColor: config?.brandingColor ?? '#4f46e5',
      brandingLogo: config?.brandingLogo ?? null,
    };
  }

  /**
   * Admin only: Update college branding.
   */
  @Put()
  @Roles(Role.ADMIN)
  async updateTheming(
    @Req() req: any,
    @Body() body: { brandingColor?: string; brandingLogo?: string },
  ) {
    const collegeId = req.user?.collegeId;
    if (!collegeId) {
      throw new NotFoundException('College context not available.');
    }

    const config = await this.prisma.collegeConfig.upsert({
      where: { collegeId },
      update: {
        brandingColor: body.brandingColor,
        brandingLogo: body.brandingLogo,
      },
      create: {
        collegeId,
        brandingColor: body.brandingColor ?? '#4f46e5',
        brandingLogo: body.brandingLogo,
      },
    });

    return {
      collegeId,
      brandingColor: config.brandingColor,
      brandingLogo: config.brandingLogo,
    };
  }
}
