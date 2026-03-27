import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role, ClubStatus } from '@prisma/client';

@Injectable()
export class CollegesService {
  constructor(private prisma: PrismaService) {}

  async register(dto: { collegeName: string; domain: string; adminName: string; adminEmail: string; adminPassword: string }) {
    // Check if college already exists
    const existingCollege = await this.prisma.college.findFirst({
      where: {
        OR: [
          { name: dto.collegeName },
          { domain: dto.domain }
        ]
      }
    });

    if (existingCollege) {
      throw new ConflictException('College with this name or domain already exists');
    }

    // Use a transaction to ensure all or nothing
    return this.prisma.$transaction(async (tx) => {
      // 1. Create College
      const college = await tx.college.create({
        data: {
          name: dto.collegeName,
          domain: dto.domain,
        }
      });

      // 2. Create College Config
      await tx.collegeConfig.create({
        data: {
          collegeId: college.id,
          brandingColor: '#4F46E5', // Default Indigo
        }
      });

      // 3. Create Admin User
      const passwordHash = await bcrypt.hash(dto.adminPassword, 10);
      const admin = await tx.user.create({
        data: {
          name: dto.adminName,
          email: dto.adminEmail,
          passwordHash,
          role: Role.ADMIN,
          collegeId: college.id,
          isVerified: true
        }
      });

      // 4. Seed Default Data (One Test Club)
      await tx.club.create({
        data: {
          name: `General Students Council - ${college.name}`,
          description: 'The primary student representative body for the college.',
          category: 'Governance',
          status: ClubStatus.ACTIVE,
          collegeId: college.id,
          coordinatorId: admin.id,
          presidentId: admin.id
        }
      });

      return {
        message: 'College registered successfully',
        collegeId: college.id,
        adminId: admin.id
      };
    });
  }

  async findAll() {
    return this.prisma.college.findMany({
      select: { id: true, name: true, domain: true }
    });
  }
}
