import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo Student',
    },
  })

  console.log('Created demo user:', user)

  // Create a student profile
  const profile = await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      timezone: 'UTC',
      preferencesJson: JSON.stringify({
        language: 'en',
        theme: 'light',
      }),
    },
  })

  console.log('Created student profile:', profile)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
