require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt           = require('bcryptjs');
const { generateSecurePassword } = require('../src/utils/password.utils');

const prisma = new PrismaClient();

/**
 * Fresh bootstrap seed — creates exactly two things:
 *   1. ONE allowed (ACTIVE) email domain, so organization-branch signups
 *      against that domain are permitted (admin panel can add more later).
 *   2. ONE SUPER_ADMIN account for the admin panel.
 *
 * SECURITY NOTE
 * ─────────────
 * This script is for LOCAL DEVELOPMENT ONLY. It refuses to run when
 * NODE_ENV=production, because seed scripts are a common source of
 * accidental backdoor accounts if ever pointed at a real database
 * (e.g. via a post-deploy hook).
 *
 * It never hardcodes credentials. The admin gets a fresh, cryptographically
 * random password that is printed to the console exactly once. Store it in a
 * password manager — it is not saved anywhere by this script. Re-running the
 * seed rotates that password (and prints the new one).
 *
 * Optional overrides (backend/.env):
 *   SEED_ADMIN_DOMAIN=yourcollege.ac.in
 *   SEED_SUPER_ADMIN_EMAIL=superadmin@example.local
 */
async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('⛔ Refusing to run prisma/seed.js with NODE_ENV=production.');
    console.error('   Seed data (including admin accounts) must never be created this way in production.');
    process.exit(1);
  }

  const domainName = (process.env.SEED_ADMIN_DOMAIN || 'yourcollege.ac.in').trim().toLowerCase();
  const adminEmail = (process.env.SEED_SUPER_ADMIN_EMAIL || 'superadmin@example.local').trim().toLowerCase();

  console.log('🌱 Seeding local development database…\n');

  // ── 1. Allowed (ACTIVE) domain ──────────────────────────────────────────────
  // `update: {}` keeps an existing domain's state untouched (an admin may have
  // deliberately deactivated it); the ACTIVE status only applies on first
  // creation, which is exactly what a fresh signup flow needs.
  const domain = await prisma.domain.upsert({
    where : { name: domainName },
    update: {},
    create: {
      name        : domainName,
      description : 'Seeded local development domain',
      status      : 'ACTIVE',
      isActive    : true,
      activatedAt : new Date(),
    },
  });
  console.log(`   ✅ Domain: ${domain.name} (status=${domain.status}, active=${domain.isActive})`);

  // ── 2. Super Admin ──────────────────────────────────────────────────────────
  const plainPassword  = process.env.SEED_ADMIN_PASS;
  const hashedPassword = await bcrypt.hash(plainPassword, 12);

  const admin = await prisma.admin.upsert({
    where : { email: adminEmail },
    update: { password: hashedPassword, status: 'ACTIVE' },
    create: {
      name    : 'Super Admin',
      email   : adminEmail,
      password: hashedPassword,
      role    : 'SUPER_ADMIN',
      status  : 'ACTIVE',
    },
  });
  console.log(`   ✅ Admin:  ${admin.email} (${admin.role}, status=${admin.status})`);

  console.log('\n🔑 One-time generated admin password (save it now — it is NOT stored anywhere):');
  console.log(`   ${plainPassword}`);
  console.log('\n   Sign in to the admin panel with the email above and this password.\n');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
