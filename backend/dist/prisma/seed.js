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
    console.log('Clearing existing data (optional but good for clean demo seed)...');
    console.log('Seeding College Admin...');
    const admin = await prisma.user.upsert({
        where: { email: 'admin@college.edu' },
        update: { role: client_1.Role.ADMIN },
        create: {
            name: 'College Admin',
            email: 'admin@college.edu',
            passwordHash,
            role: client_1.Role.ADMIN,
        },
    });
    console.log('Seeding Faculty Coordinator...');
    const faculty = await prisma.user.upsert({
        where: { email: 'faculty@college.edu' },
        update: { role: client_1.Role.COORDINATOR },
        create: {
            name: 'Dr. Alan Turing',
            email: 'faculty@college.edu',
            passwordHash,
            role: client_1.Role.COORDINATOR,
            department: 'Computer Science',
        },
    });
    console.log('Seeding Club President...');
    const president = await prisma.user.upsert({
        where: { email: 'president@college.edu' },
        update: { role: client_1.Role.PRESIDENT },
        create: {
            name: 'Alice President',
            email: 'president@college.edu',
            passwordHash,
            role: client_1.Role.PRESIDENT,
            studentId: 'STU001',
        },
    });
    console.log('Seeding Club Vice President...');
    const vp = await prisma.user.upsert({
        where: { email: 'vp@college.edu' },
        update: { role: client_1.Role.VP },
        create: {
            name: 'Bob VicePresident',
            email: 'vp@college.edu',
            passwordHash,
            role: client_1.Role.VP,
            studentId: 'STU002',
        },
    });
    console.log('Seeding Active Member...');
    const member = await prisma.user.upsert({
        where: { email: 'member@college.edu' },
        update: { role: client_1.Role.MEMBER },
        create: {
            name: 'Charlie Member',
            email: 'member@college.edu',
            passwordHash,
            role: client_1.Role.MEMBER,
            studentId: 'STU003',
        },
    });
    console.log('Seeding Active Club (Tech Innovators Club)...');
    const techClub = await prisma.club.upsert({
        where: { name: 'Tech Innovators Club' },
        update: {
            status: client_1.ClubStatus.ACTIVE,
            coordinatorId: faculty.id,
            presidentId: president.id,
            vpId: vp.id,
            prizePoolBalance: 5000.0,
        },
        create: {
            name: 'Tech Innovators Club',
            description: 'A club for tech enthusiasts, coding, and AI innovations. Our mission is to build the future.',
            category: 'Technology',
            status: client_1.ClubStatus.ACTIVE,
            coordinatorId: faculty.id,
            presidentId: president.id,
            vpId: vp.id,
            prizePoolBalance: 5000.0,
        },
    });
    console.log('Seeding Pending Club (Robotics Society)...');
    await prisma.club.upsert({
        where: { name: 'Robotics Society' },
        update: {},
        create: {
            name: 'Robotics Society',
            description: 'Building autonomous robots and drones for the upcoming national competition.',
            category: 'Engineering',
            status: client_1.ClubStatus.PENDING,
        },
    });
    console.log('Seeding Club Memberships...');
    const memberships = [
        { userId: president.id, role: 'President' },
        { userId: vp.id, role: 'Vice President' },
        { userId: member.id, role: 'Event Head' },
    ];
    for (const m of memberships) {
        const exists = await prisma.clubMember.findUnique({
            where: { userId_clubId: { userId: m.userId, clubId: techClub.id } }
        });
        if (!exists) {
            await prisma.clubMember.create({
                data: {
                    userId: m.userId,
                    clubId: techClub.id,
                    customRole: m.role,
                }
            });
        }
    }
    console.log('Seeding Events...');
    const pastEvent = await prisma.event.create({
        data: {
            title: 'Intro to Artificial Intelligence',
            description: 'A beginner-friendly workshop on neural networks and ML.',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            venue: 'Auditorium A',
            capacity: 100,
            budget: 500.0,
            status: client_1.EventStatus.CONCLUDED,
            isPublic: true,
            clubId: techClub.id,
        }
    });
    const upcomingEvent = await prisma.event.create({
        data: {
            title: 'Global Hackathon 2026',
            description: 'The biggest coding competition of the year. Exciting prizes up for grabs!',
            date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            venue: 'Main Campus Hall',
            capacity: 300,
            budget: 2000.0,
            status: client_1.EventStatus.APPROVED,
            isPublic: true,
            clubId: techClub.id,
        }
    });
    console.log('Seeding Sponsors...');
    const sponsorGoogle = await prisma.sponsor.create({
        data: {
            name: 'Google',
            organization: 'Alphabet Inc.',
            email: 'sponsorships@google.com',
            phone: '+1-555-0101',
            status: client_1.SponsorStatus.CONFIRMED,
            clubId: techClub.id,
        }
    });
    await prisma.sponsor.create({
        data: {
            name: 'Microsoft',
            organization: 'Microsoft Corp.',
            email: 'programs@microsoft.com',
            status: client_1.SponsorStatus.NEGOTIATING,
            clubId: techClub.id,
        }
    });
    console.log('Seeding Transactions...');
    await prisma.transaction.create({
        data: {
            amount: 3000.0,
            type: client_1.TransactionType.CREDIT,
            description: 'Initial College Grant for Tech Club',
            clubId: techClub.id,
            txnHash: 'LZXQ2RYZ4TYY5GZ2XQZ4TYY5GGZ2XQZ4TYY5G2XQZ4TYY5GZ2XQ',
        }
    });
    await prisma.transaction.create({
        data: {
            amount: 2500.0,
            type: client_1.TransactionType.CREDIT,
            description: 'Sponsorship contribution for Hackathon',
            clubId: techClub.id,
            sponsorId: sponsorGoogle.id,
            txnHash: 'MQPX3RZZ5UZZ6H3ZZ5UZZ6HHZZ5UZZ6M3ZZ5UZZ6H3ZZ5UZZXQZ',
        }
    });
    await prisma.transaction.create({
        data: {
            amount: 500.0,
            type: client_1.TransactionType.DEBIT,
            description: 'Expenses for AI Workshop catering',
            clubId: techClub.id,
            eventId: pastEvent.id,
            txnHash: 'NRYY4SAAY6VAA7I4AAAY6VAA7IIAAAY6VAA7N4AAAY6VAA7IAAA',
        }
    });
    console.log('Seeding Tasks...');
    await prisma.task.create({
        data: {
            title: 'Design Hackathon Poster',
            description: 'Create a vibrant poster for the upcoming Hackathon event and post it on socials.',
            deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            priority: client_1.TaskPriority.HIGH,
            status: client_1.TaskStatus.TODO,
            clubId: techClub.id,
            assigneeId: member.id,
        }
    });
    await prisma.task.create({
        data: {
            title: 'Finalize Hackathon Venue Requirements',
            description: 'Coordinate with college administration for power slots and wifi.',
            deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            priority: client_1.TaskPriority.HIGH,
            status: client_1.TaskStatus.IN_PROGRESS,
            clubId: techClub.id,
            assigneeId: vp.id,
        }
    });
    console.log('Database seeded with beautiful demo data!');
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