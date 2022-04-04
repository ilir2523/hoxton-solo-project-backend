import { Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({ log: ['query', 'error', 'warn', 'info'] })

// const users: Prisma.UserCreateInput[] = [
//     {
//         name: 'Ilir',
//         email: 'ilir@email.com',
//         password: 'ilir1234',
//         phone: '+3551212123',
//         address: 'Tirana',
//         dateOfBirth: '12/29/1999',
//     }
// ]

// const acounts: Prisma.AccountCreateInput[] = [
//     {
//         accountNumber: 123456789,
//         type: 'Savings',
//         currency: 'LEK',
//         title: 'Savings account',
//         amountInAccount: 0, 
//         userId: 1,
//     },
//     {
//         accountNumber: 123456798,
//         type: 'Savings',
//         currency: 'LEK',
//         title: 'Savings account',
//         amountInAccount: 0, 
//         userId: 3
//     },
//     {
//         accountNumber: 123456978,
//         type: 'Savings',
//         currency: 'LEK',
//         title: 'IBM account',
//         amountInAccount: 1000000, 
//         userId: 6
//     }
// ]

async function createStuf() {
    // for (const user of users) {
    //     await prisma.user.create({data: user})
    // }
    // for (const account of acounts) {
    //     await prisma.account.create({data: account})
    // }
}

createStuf()