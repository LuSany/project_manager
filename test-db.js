import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  try {
    console.log('Testing database connection...')
    const user = await prisma.users.findFirst()
    console.log('User found:', user)
    await prisma.$disconnect()
    console.log('Success!')
  } catch (error) {
    console.error('Error:', error)
    await prisma.$disconnect()
  }
}

test()
