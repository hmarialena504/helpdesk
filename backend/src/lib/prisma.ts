import { PrismaClient } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
// due to hot reloading creating a new instance on every restart
declare global {
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export default prisma