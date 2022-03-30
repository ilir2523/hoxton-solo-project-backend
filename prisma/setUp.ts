import { Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({ log: ['query', 'error', 'warn', 'info'] })

const users: Prisma.UserCreateInput[] = [
    {
        name: 'Ilir',
        email: 'ilir@email.com',
        password: 'ilir1234',
        phone: '+3551212123',
        address: 'Tirana',
        dateOfBirth: '12/29/1999',
    }
]

async function createStuf() {
    for (const user of users) {
        await prisma.user.create({data: user})
    }
}

createStuf()