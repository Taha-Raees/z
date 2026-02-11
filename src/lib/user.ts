import type { User } from '@prisma/client'
import { prisma } from './prisma'

function createLocalEmail(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  return `local-${timestamp}-${random}@local.school`
}

export async function resolveActiveUser(): Promise<User> {
  const existing = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
  })

  if (existing) {
    return existing
  }

  return prisma.user.create({
    data: {
      email: createLocalEmail(),
      name: 'Student',
    },
  })
}

