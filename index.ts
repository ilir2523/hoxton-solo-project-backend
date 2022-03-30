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
            id: true, name: true, email: true 
        }
    })
    return user
}

app.post('/sign-in', async (req, res) => {
    const { email, password } = req.body
    try {
        const user = await prisma.user.findUnique({
            where: { email: email }
        })
        const passwordMatches = bcrypt.compareSync(password, user.password)
        if (user && passwordMatches) {
            const { id, name, email } = user
            res.send({ user: { id, name, email }, token: createToken(user.id) })
        } else {
            throw Error()
        }
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
                data: { password: hash } })
            const { id, name } = user
            res.send({ user: { id, name, email }, token: createToken(user.id) })
        } catch (err) {
            // @ts-ignore
            res.status(400).send({ error: 'User/password invalid.' })
        }
    } else res.status(400).send({ error: 'User/password invalid.' })
})

app.listen(PORT, () => {
    console.log(`Server runing on: http://localhost:${PORT}/`)
})