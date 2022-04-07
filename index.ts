import * as express from 'express';
import { PrismaClient } from '@prisma/client'
import * as cors from 'cors'
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 4001

const prisma = new PrismaClient({ log: ['query', 'error', 'warn', 'info'] })


function createToken(id: number) {
    return jwt.sign({ id: id }, process.env.MY_SECRET, { expiresIn: '3days' })
}

async function getUserFromToken(token: string) {
    const decodedToken = jwt.verify(token, process.env.MY_SECRET)
    const user = await prisma.user.findUnique({
        // @ts-ignore
        where: { id: decodedToken.id },
        select: {
            id: true, name: true, email: true, address: true, phone: true, dateOfBirth: true, accounts: { include: { transactions: true } }
        }
    })
    return user
}

app.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true, name: true, email: true, address: true, phone: true, dateOfBirth: true, accounts: { include: { transactions: true } }
            }
        })
        res.send(users)
    } catch (err) {
        res.status(400).send(err.message)
    }
})

app.post('/sign-in', async (req, res) => {
    const { email, password } = req.body
    try {
        const user = await prisma.user.findUnique({
            where: { email: email }
        })
        const passwordMatches = bcrypt.compareSync(password, user.password)
        if (user && passwordMatches) {
            const userToSend = await prisma.user.findUnique({
                where: { email: email },
                select: {
                    id: true, name: true, email: true, address: true, phone: true, dateOfBirth: true, accounts: { include: { transactions: true } }
                }
            })
            res.send({ user: userToSend, token: createToken(user.id) })
        } else {
            throw Error()
        }
    } catch (err) {
        res.status(400).send({ error: 'User/password invalid.' })
    }
})

app.post('/sign-up', async (req, res) => {
    const { email, password, name, phone, address, dateOfBirth } = req.body

    try {
        const hash = bcrypt.hashSync(password, 8)
        const user = await prisma.user.create({
            data: {
                email,
                password: hash,
                name,
                phone,
                address,
                dateOfBirth
            },
            select: {
                id: true, name: true, email: true, address: true, phone: true, dateOfBirth: true, accounts: { include: { transactions: true } }
            }
        })
        res.send({ user, token: createToken(user.id) })
    } catch (err) {
        res.status(400).send({ error: 'User/password invalid.' })
    }

})

app.patch('/changePassword', async (req, res) => {
    const { email, password, newPassword } = req.body
    const user = await prisma.user.findFirst({ where: { email: email } })
    const passwordMatches = bcrypt.compareSync(password, user.password)
    if (user && passwordMatches) {
        try {
            const hash = bcrypt.hashSync(newPassword, 8)
            const updateUser = await prisma.user.update({
                where: {
                    email: email,
                },
                data: { password: hash }
            })
            const { id, name } = user
            res.send({ user: { id, name, email }, token: createToken(user.id) })
        } catch (err) {
            // @ts-ignore
            res.status(400).send({ error: 'User/password invalid.' })
        }
    } else res.status(400).send({ error: 'User/password invalid.' })
})

app.get('/validate', async (req, res) => {
    const token = req.headers.authorization

    try {
        // @ts-ignore
        const user = await getUserFromToken(token)
        res.send(user)
    } catch (err) {
        res.status(400).send(err.message)
    }
})

app.get('/account/:id', async (req, res) => {
    const { id } = req.params
    try {
        const account = await prisma.account.findUnique({
            where: { id: Number(id) },

        })
        res.send(account)
    } catch (err) {
        res.status(400).send(err.message)
    }
})

app.post('/createTransfer', async (req, res) => {
    const { fromAccountId, toAccountId, amount } = req.body
    try {
        const fromAccount = await prisma.account.findUnique({
            where: { id: Number(fromAccountId) }
        })
        const toAccount = await prisma.account.findUnique({
            where: { id: Number(toAccountId) }
        })
        if (Number(fromAccount.amountInAccount) < Number(amount)) {
            throw Error('Not enough money.')
        }
        const fromAccountUpdate = await prisma.account.update({
            where: { id: Number(fromAccountId) },
            // @ts-ignore
            data: { amountInAccount: fromAccount.amountInAccount - Number(amount) }
        })
        const toAccountUpdate = await prisma.account.update({
            where: { id: Number(toAccountId) },
            data: { amountInAccount: Number(toAccount.amountInAccount) + Number(amount) }
        })
        const firstTransaction = await prisma.transaction.create({
            data: {
                account: { connect: { id: Number(fromAccountId) } },
                receiver: Number(toAccountId),
                sender: Number(fromAccountId),
                isPositive: false,
                amount: amount
            }
        })
        const secondTransaction = await prisma.transaction.create({
            data: {
                account: { connect: { id: Number(toAccountId) } },
                receiver: Number(toAccountId),
                sender: Number(fromAccountId),
                isPositive: true,
                amount: amount
            }
        })
        res.send({ fromAccountUpdate, toAccountUpdate, firstTransaction, secondTransaction })
    } catch (err) {
        res.status(400).send(err.message)
    }
})

app.listen(PORT, () => {
    console.log(`Server runing on: http://localhost:${PORT}/`)
})