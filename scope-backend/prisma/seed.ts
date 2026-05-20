/**
 * prisma/seed.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * SCOPE Platform — Heavy Development Seed Data
 * Run with:  npx prisma db seed
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient, ProjectStatus, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'Test1234!';
const SALT_ROUNDS = 10;
const hash = (plain: string) => bcrypt.hash(plain, SALT_ROUNDS);

async function main() {
  console.log('🌱 Starting heavy SCOPE seed...\n');
  const password = await hash(SEED_PASSWORD);

  // 0. Clean slate
  console.log('🗑 Clearing existing seed data...');
  await prisma.projectApplication.deleteMany();
  await prisma.advisorRequest.deleteMany();
  await prisma.teamAd.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.advisorProfile.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();

  // 1. Categories
  console.log('📂 Creating categories...');
  const catNames = ['Web', 'Mobile', 'AI / ML', 'Cybersecurity', 'Bioinformatics', 'Robotics', 'Game Dev'];
  const categories = await Promise.all(
    catNames.map(name => prisma.category.create({ data: { name } }))
  );

  // 2. Advisors (5+)
  console.log('🎓 Creating 6 advisors...');
  const advisorData = [
    { email: 'advisor1@adv.uskudar.edu.tr', name: 'Dr. Ayşe Kaya', title: 'Assoc. Prof.', dep: 'Computer Eng', exp: ['Machine Learning', 'NLP'] },
    { email: 'advisor2@adv.uskudar.edu.tr', name: 'Prof. Mehmet Demir', title: 'Professor', dep: 'Software Eng', exp: ['Cloud Computing', 'Microservices'] },
    { email: 'advisor3@adv.uskudar.edu.tr', name: 'Dr. Elif Şahin', title: 'Assoc. Prof.', dep: 'Bioengineering', exp: ['Bioinformatics', 'Genomics'] },
    { email: 'advisor4@adv.uskudar.edu.tr', name: 'Dr. Ahmet Yılmaz', title: 'Asst. Prof.', dep: 'Cybersecurity', exp: ['Cryptography', 'Network Security'] },
    { email: 'advisor5@adv.uskudar.edu.tr', name: 'Dr. Zeynep Arslan', title: 'Asst. Prof.', dep: 'Electrical Eng', exp: ['Robotics', 'IoT'] },
    { email: 'advisor6@adv.uskudar.edu.tr', name: 'Prof. Burak Can', title: 'Professor', dep: 'Computer Eng', exp: ['Game Development', 'Computer Graphics'] },
  ];

  const advisors = [];
  for (const a of advisorData) {
    const user = await prisma.user.create({
      data: {
        email: a.email, password, name: a.name, role: 'INSTRUCTOR',
        advisorProfile: {
          create: { title: a.title, department: a.dep, expertise: a.exp, researchInterests: a.exp, previousProjects: [] }
        }
      }
    });
    advisors.push(user);
  }

  // 3. Students (20+)
  console.log('🎒 Creating 25 students...');
  const students = [];
  for (let i = 1; i <= 25; i++) {
    const user = await prisma.user.create({
      data: {
        email: `student${i}@st.uskudar.edu.tr`, password, name: `Student ${i}`, role: 'STUDENT',
        studentProfile: {
          create: {
            year: i % 2 === 0 ? '4th Year' : '3rd Year',
            department: i % 3 === 0 ? 'Software Engineering' : 'Computer Engineering',
            bio: `Hello, I am Student ${i}. I am passionate about technology.`,
            technicalSkills: ['JavaScript', 'Python', i % 2 === 0 ? 'React' : 'Node.js']
          }
        }
      }
    });
    students.push(user);
  }

  // Admin
  await prisma.user.create({ data: { email: 'admin@ad.uskudar.edu.tr', password, name: 'System Admin', role: 'ADMIN' } });

  // 4. Projects (10+)
  console.log('📁 Creating 12 projects...');
  const projectData = [
    { title: 'AI Paper Summarizer', cat: 2, status: ProjectStatus.IN_PROGRESS, owner: 0, adv: 0, budget: '15000' },
    { title: 'Campus Navigator App', cat: 1, status: ProjectStatus.ADVISOR_ASSIGNED, owner: 1, adv: 1, budget: '8000' },
    { title: 'Internship Portal', cat: 0, status: ProjectStatus.COMPLETED, owner: 2, adv: 1, budget: '10000' },
    { title: 'DNA Sequencing Analysis Tool', cat: 4, status: ProjectStatus.PENDING_ADVISOR, owner: 3, adv: null, budget: '20000' },
    { title: 'Zero-Trust Network Auth', cat: 3, status: ProjectStatus.IN_PROGRESS, owner: 4, adv: 3, budget: '5000' },
    { title: 'Autonomous Drone Delivery', cat: 5, status: ProjectStatus.DRAFT, owner: 5, adv: null, budget: '25000' },
    { title: 'VR Educational Game', cat: 6, status: ProjectStatus.REVIEW_PHASE, owner: 6, adv: 5, budget: '12000' },
    { title: 'Blockchain Voting System', cat: 3, status: ProjectStatus.IN_PROGRESS, owner: 7, adv: 3, budget: '0' },
    { title: 'IoT Smart Agriculture', cat: 5, status: ProjectStatus.ADVISOR_ASSIGNED, owner: 8, adv: 4, budget: '30000' },
    { title: 'Sign Language Translator AI', cat: 2, status: ProjectStatus.IN_PROGRESS, owner: 9, adv: 0, budget: '5000' },
    { title: 'E-Commerce Microservices', cat: 0, status: ProjectStatus.COMPLETED, owner: 10, adv: 1, budget: '2000' },
    { title: 'Health Tracking Mobile App', cat: 1, status: ProjectStatus.PENDING_ADVISOR, owner: 11, adv: null, budget: '1000' }
  ];

  const projects = [];
  for (const p of projectData) {
    const project = await prisma.project.create({
      data: {
        title: p.title, description: `A great project about ${p.title}.`, budget: `${p.budget} TL`,
        requiredSkills: ['Teamwork', 'Coding'], status: p.status,
        categoryId: categories[p.cat].id,
        ownerId: students[p.owner].id,
        advisorId: p.adv !== null ? advisors[p.adv].id : null,
        teamMembers: {
          create: { userId: students[p.owner].id, role: 'Project Lead' }
        }
      }
    });
    projects.push(project);
  }

  // 5. Assign Extra Team Members (to reach capacity limits)
  // Let's max out 'Sign Language Translator AI' (projects[9]) with 4 members
  await prisma.teamMember.createMany({
    data: [
      { projectId: projects[9].id, userId: students[12].id, role: 'Backend' },
      { projectId: projects[9].id, userId: students[13].id, role: 'Frontend' },
      { projectId: projects[9].id, userId: students[14].id, role: 'Data Scientist' },
    ]
  });

  // 6. Applications
  console.log('📝 Creating project applications...');
  await prisma.projectApplication.createMany({
    data: [
      { projectId: projects[0].id, studentId: students[15].id, requestedRoles: ['Developer'], status: 'PENDING' },
      { projectId: projects[0].id, studentId: students[16].id, requestedRoles: ['UI/UX'], status: 'PENDING' },
      // project 9 is full, student 17 applies
      { projectId: projects[9].id, studentId: students[17].id, requestedRoles: ['Tester'], status: 'PENDING' },
      { projectId: projects[1].id, studentId: students[18].id, requestedRoles: ['Mobile Dev'], status: 'PENDING' },
    ]
  });

  console.log('✅ Heavy seed completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
