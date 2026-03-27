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
    const college = await prisma.college.upsert({
        where: { name: 'Demo College' },
        update: {
            domain: 'college.edu',
        },
        create: {
            name: 'Demo College',
            domain: 'college.edu',
        },
    });
    await prisma.collegeConfig.upsert({
        where: { collegeId: college.id },
        update: {},
        create: {
            collegeId: college.id,
            brandingColor: '#4F46E5',
        },
    });
    const admin = await prisma.user.upsert({
        where: { email: 'admin@college.edu' },
        update: { role: client_1.Role.ADMIN, collegeId: college.id },
        create: {
            collegeId: college.id,
            name: 'College Admin',
            email: 'admin@college.edu',
            passwordHash,
            role: client_1.Role.ADMIN,
            isVerified: true,
        },
    });
    const faculty = await prisma.user.upsert({
        where: { email: 'faculty@college.edu' },
        update: { role: client_1.Role.COORDINATOR, collegeId: college.id },
        create: {
            collegeId: college.id,
            name: 'Dr. Alan Turing',
            email: 'faculty@college.edu',
            passwordHash,
            role: client_1.Role.COORDINATOR,
            department: 'Computer Science',
            isVerified: true,
        },
    });
    const president = await prisma.user.upsert({
        where: { email: 'president@college.edu' },
        update: { role: client_1.Role.PRESIDENT, collegeId: college.id },
        create: {
            collegeId: college.id,
            name: 'Alice President',
            email: 'president@college.edu',
            passwordHash,
            role: client_1.Role.PRESIDENT,
            studentId: 'STU001',
            isVerified: true,
        },
    });
    const vp = await prisma.user.upsert({
        where: { email: 'vp@college.edu' },
        update: { role: client_1.Role.VP, collegeId: college.id },
        create: {
            collegeId: college.id,
            name: 'Bob VicePresident',
            email: 'vp@college.edu',
            passwordHash,
            role: client_1.Role.VP,
            studentId: 'STU002',
            isVerified: true,
        },
    });
    const member = await prisma.user.upsert({
        where: { email: 'member@college.edu' },
        update: { role: client_1.Role.MEMBER, collegeId: college.id },
        create: {
            collegeId: college.id,
            name: 'Charlie Member',
            email: 'member@college.edu',
            passwordHash,
            role: client_1.Role.MEMBER,
            studentId: 'STU003',
            isVerified: true,
        },
    });
    const techClub = await prisma.club.upsert({
        where: { name: 'Tech Innovators Club' },
        update: {
            collegeId: college.id,
            status: client_1.ClubStatus.ACTIVE,
            coordinatorId: faculty.id,
            presidentId: president.id,
            vpId: vp.id,
            prizePoolBalance: 5000.0,
        },
        create: {
            collegeId: college.id,
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
    await prisma.club.upsert({
        where: { name: 'Robotics Society' },
        update: {
            collegeId: college.id,
            status: client_1.ClubStatus.PENDING,
            presidentId: president.id,
            vpId: vp.id,
            coordinatorId: faculty.id,
        },
        create: {
            collegeId: college.id,
            name: 'Robotics Society',
            description: 'Building autonomous robots and drones for the upcoming national competition.',
            category: 'Engineering',
            status: client_1.ClubStatus.PENDING,
            presidentId: president.id,
            vpId: vp.id,
            coordinatorId: faculty.id,
        },
    });
    const memberships = [
        { userId: president.id, role: 'President' },
        { userId: vp.id, role: 'Vice President' },
        { userId: member.id, role: 'Event Head' },
    ];
    for (const membership of memberships) {
        const exists = await prisma.clubMember.findUnique({
            where: {
                userId_clubId: { userId: membership.userId, clubId: techClub.id },
            },
        });
        if (!exists) {
            await prisma.clubMember.create({
                data: {
                    collegeId: college.id,
                    userId: membership.userId,
                    clubId: techClub.id,
                    customRole: membership.role,
                },
            });
        }
    }
    const pastEvent = await prisma.event.upsert({
        where: { id: 'seed-past-event' },
        update: {
            collegeId: college.id,
            clubId: techClub.id,
        },
        create: {
            id: 'seed-past-event',
            collegeId: college.id,
            title: 'Intro to Artificial Intelligence',
            description: 'A beginner-friendly workshop on neural networks and ML.',
            category: 'Workshop',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            venue: 'Auditorium A',
            capacity: 100,
            budget: 500.0,
            status: client_1.EventStatus.CONCLUDED,
            isPublic: true,
            clubId: techClub.id,
        },
    });
    const upcomingEvent = await prisma.event.upsert({
        where: { id: 'seed-upcoming-event' },
        update: {
            collegeId: college.id,
            clubId: techClub.id,
        },
        create: {
            id: 'seed-upcoming-event',
            collegeId: college.id,
            title: 'Global Hackathon 2026',
            description: 'The biggest coding competition of the year. Exciting prizes up for grabs!',
            category: 'Hackathon',
            date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            venue: 'Main Campus Hall',
            capacity: 300,
            budget: 2000.0,
            status: client_1.EventStatus.APPROVED,
            isPublic: true,
            clubId: techClub.id,
        },
    });
    const sponsorGoogle = await prisma.sponsor.upsert({
        where: { id: 'seed-google-sponsor' },
        update: {
            collegeId: college.id,
            clubId: techClub.id,
            status: client_1.SponsorStatus.CONFIRMED,
        },
        create: {
            id: 'seed-google-sponsor',
            collegeId: college.id,
            name: 'Google',
            organization: 'Alphabet Inc.',
            email: 'sponsorships@google.com',
            phone: '+1-555-0101',
            status: client_1.SponsorStatus.CONFIRMED,
            clubId: techClub.id,
        },
    });
    await prisma.sponsor.upsert({
        where: { id: 'seed-microsoft-sponsor' },
        update: {
            collegeId: college.id,
            clubId: techClub.id,
            status: client_1.SponsorStatus.NEGOTIATING,
        },
        create: {
            id: 'seed-microsoft-sponsor',
            collegeId: college.id,
            name: 'Microsoft',
            organization: 'Microsoft Corp.',
            email: 'programs@microsoft.com',
            status: client_1.SponsorStatus.NEGOTIATING,
            clubId: techClub.id,
        },
    });
    await prisma.transaction.upsert({
        where: {
            txnHash: 'LZXQ2RYZ4TYY5GZ2XQZ4TYY5GGZ2XQZ4TYY5G2XQZ4TYY5GZ2XQ',
        },
        update: {
            collegeId: college.id,
            clubId: techClub.id,
        },
        create: {
            collegeId: college.id,
            amount: 3000.0,
            type: client_1.TransactionType.CREDIT,
            description: 'Initial College Grant for Tech Club',
            clubId: techClub.id,
            txnHash: 'LZXQ2RYZ4TYY5GZ2XQZ4TYY5GGZ2XQZ4TYY5G2XQZ4TYY5GZ2XQ',
        },
    });
    await prisma.transaction.upsert({
        where: {
            txnHash: 'MQPX3RZZ5UZZ6H3ZZ5UZZ6HHZZ5UZZ6M3ZZ5UZZ6H3ZZ5UZZXQZ',
        },
        update: {
            collegeId: college.id,
            clubId: techClub.id,
            sponsorId: sponsorGoogle.id,
        },
        create: {
            collegeId: college.id,
            amount: 2500.0,
            type: client_1.TransactionType.CREDIT,
            description: 'Sponsorship contribution for Hackathon',
            clubId: techClub.id,
            sponsorId: sponsorGoogle.id,
            txnHash: 'MQPX3RZZ5UZZ6H3ZZ5UZZ6HHZZ5UZZ6M3ZZ5UZZ6H3ZZ5UZZXQZ',
        },
    });
    await prisma.transaction.upsert({
        where: {
            txnHash: 'NRYY4SAAY6VAA7I4AAAY6VAA7IIAAAY6VAA7N4AAAY6VAA7IAAA',
        },
        update: {
            collegeId: college.id,
            clubId: techClub.id,
            eventId: pastEvent.id,
        },
        create: {
            collegeId: college.id,
            amount: 500.0,
            type: client_1.TransactionType.DEBIT,
            description: 'Expenses for AI Workshop catering',
            clubId: techClub.id,
            eventId: pastEvent.id,
            txnHash: 'NRYY4SAAY6VAA7I4AAAY6VAA7IIAAAY6VAA7N4AAAY6VAA7IAAA',
        },
    });
    await prisma.task.upsert({
        where: { id: 'seed-task-poster' },
        update: {
            collegeId: college.id,
            clubId: techClub.id,
            assigneeId: member.id,
        },
        create: {
            id: 'seed-task-poster',
            collegeId: college.id,
            title: 'Design Hackathon Poster',
            description: 'Create a vibrant poster for the upcoming Hackathon event and post it on socials.',
            deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            priority: client_1.TaskPriority.HIGH,
            status: client_1.TaskStatus.TODO,
            clubId: techClub.id,
            eventId: upcomingEvent.id,
            assigneeId: member.id,
        },
    });
    await prisma.task.upsert({
        where: { id: 'seed-task-venue' },
        update: {
            collegeId: college.id,
            clubId: techClub.id,
            assigneeId: vp.id,
        },
        create: {
            id: 'seed-task-venue',
            collegeId: college.id,
            title: 'Finalize Hackathon Venue Requirements',
            description: 'Coordinate with college administration for power slots and wifi.',
            deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            priority: client_1.TaskPriority.HIGH,
            status: client_1.TaskStatus.IN_PROGRESS,
            clubId: techClub.id,
            eventId: upcomingEvent.id,
            assigneeId: vp.id,
        },
    });
    console.log('Database seeded with demo data');
    console.log(`Admin user: ${admin.email}`);
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map