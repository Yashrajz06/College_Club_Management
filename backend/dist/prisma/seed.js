"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    const passwordHash = await bcrypt.hash('password123', 10);
    console.log('Seeding College Admin...');
    await prisma.user.upsert({
        where: { email: 'admin@college.edu' },
        update: {},
        create: {
            name: 'College Admin',
            email: 'admin@college.edu',
            passwordHash,
            role: client_1.Role.ADMIN,
        },
    });
    console.log('Seeding Faculty Coordinator...');
    await prisma.user.upsert({
        where: { email: 'faculty@college.edu' },
        update: {},
        create: {
            name: 'Dr. Faculty Member',
            email: 'faculty@college.edu',
            passwordHash,
            role: client_1.Role.COORDINATOR,
        },
    });
    console.log('Seeding Club President...');
    await prisma.user.upsert({
        where: { email: 'president@college.edu' },
        update: {},
        create: {
            name: 'Student President',
            email: 'president@college.edu',
            passwordHash,
            role: client_1.Role.PRESIDENT,
        },
    });
    console.log('Seeding Club Member...');
    await prisma.user.upsert({
        where: { email: 'member@college.edu' },
        update: {},
        create: {
            name: 'Active Member',
            email: 'member@college.edu',
            passwordHash,
            role: client_1.Role.MEMBER,
        },
    });
    console.log('Database seeded successfully.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map