import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const password = 'Scope2026!';
  const hashed = await bcrypt.hash(password, 10);

  const users = [
    {
      name: 'Mehmet Velat Soydan',
      email: 'velat@st.uskudar.edu.tr',
      role: 'STUDENT' as Role,
      profile: 'student',
    },
    {
      name: 'Prof. Dr. Ahmet Yilmaz',
      email: 'ahmet.yilmaz@uskudar.edu.tr',
      role: 'INSTRUCTOR' as Role,
      profile: 'advisor',
    },
    {
      name: 'Sistem Yoneticisi',
      email: 'admin@uskudar.edu.tr',
      role: 'ADMIN' as Role,
      profile: 'none',
    },
  ];

  for (const u of users) {
    // Delete existing to allow re-running cleanly
    await prisma.user.deleteMany({ where: { email: u.email } });

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: u.name,
          email: u.email,
          password: hashed,
          role: u.role,
        },
      });

      if (u.profile === 'student') {
        await tx.studentProfile.create({ data: { userId: user.id } });
      } else if (u.profile === 'advisor') {
        await tx.advisorProfile.create({ data: { userId: user.id } });
      }

      return user;
    });

    console.log(`✅ Created [${created.role}]: ${created.name} <${created.email}>`);
  }

  console.log('\n==============================');
  console.log('  TEST CREDENTIALS');
  console.log('==============================');
  console.log('  Student  : velat@st.uskudar.edu.tr');
  console.log('  Advisor  : ahmet.yilmaz@uskudar.edu.tr');
  console.log('  Admin    : admin@uskudar.edu.tr');
  console.log('  Password : Scope2026!  (all accounts)');
  console.log('==============================\n');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); throw e; })
  .finally(() => prisma.$disconnect());
