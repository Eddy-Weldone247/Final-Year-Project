// Promote a user to the ADMIN role (or demote with --demote).
//
//   node scripts/promote-admin.cjs <email>
//   node scripts/promote-admin.cjs <email> --demote
//
// Falls back to the ADMIN_EMAIL env var when no email argument is given.
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const demote = args.includes('--demote');
  const email = (args.find((a) => !a.startsWith('--')) ?? process.env.ADMIN_EMAIL ?? '')
    .toLowerCase()
    .trim();

  if (!email) {
    console.error('Usage: node scripts/promote-admin.cjs <email> [--demote]');
    console.error('(or set ADMIN_EMAIL in backend/.env)');
    process.exit(1);
  }

  const role = demote ? 'USER' : 'ADMIN';
  try {
    const user = await prisma.user.update({ where: { email }, data: { role } });
    console.log(`✅ ${user.email} is now ${user.role}`);
  } catch (err) {
    if (err && err.code === 'P2025') {
      console.error(`No user found with email: ${email}`);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}

main().finally(() => prisma.$disconnect());
