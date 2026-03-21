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
const COLLEGE_NAME = 'MIT World Peace University';
const ADMIN_NAME = 'Super Admin';
const ADMIN_EMAIL = 'admin@mit.edu.in';
const TEMP_PASSWORD = 'tempPassword123!';
async function main() {
    console.log('--- College Admin Seeder ---');
    console.log(`Checking if admin ${ADMIN_EMAIL} exists...`);
    const existing = await prisma.user.findUnique({
        where: { email: ADMIN_EMAIL },
    });
    if (existing) {
        console.log('Admin already exists');
        process.exit(0);
    }
    const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 10);
    await prisma.user.create({
        data: {
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            passwordHash,
            role: client_1.Role.ADMIN,
            isVerified: true,
            inviteToken: null,
            inviteTokenExpiry: null,
        },
    });
    console.log('Admin created successfully');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=create-admin.js.map