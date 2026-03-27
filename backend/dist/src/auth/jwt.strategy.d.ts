import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ClsService } from 'nestjs-cls';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    private readonly cls;
    constructor(prisma: PrismaService, cls: ClsService);
    validate(payload: any): Promise<{
        userId: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        collegeId: string;
    }>;
}
export {};
