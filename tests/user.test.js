require('dotenv').config()
const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../app')
const server = app.listen(8080, () => {
    console.log('testing on port 8080')
})
const User = require('../models/user')
let mongoServer

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri())
})

afterAll(async () => {
    await mongoose.connection.close()
    mongoServer.stop()
    server.close()
})

describe('Test user endpoints', () => {
    test('It should create a new user', async () => {
        const response = await request(app)
            .post('/users')
            .send({
                firstName: 'Goldie', 
                lastName: 'Locks', 
                email: 'hello@notmyhouse.com',
                password: 'porridge', 
            })
        expect(response.statusCode).toBe(200)
        expect(response.body.firstName).toEqual('Goldie')
        expect(response.body.lastName).toEqual('Locks')
        expect(response.body.email).toEqual('hello@notmyhouse.com')
        expect(response.body.isLoggedIn).toEqual(false)
    })

    test('It should show a user', async () => {
        const user = new User({
            firstName: 'Muffin',
            lastName: 'Man',
            email: 'doyouknowme@drurylane.com',
            password: 'nocupcakes',
            isLoggedIn: true
        })
        await user.save()
        const token = await user.generateAuthToken()

        const response = await request(app)
            .get(`/users/${user._id}`)
            .set('Authorization', `Bearer ${token}`)

        expect(response.statusCode).toBe(200)
        expect(response.body.firstName).toEqual('Muffin')
        expect(response.body.lastName).toEqual('Man')
        expect(response.body.email).toEqual('doyouknowme@drurylane.com')
    })

    test('It should update a user', async () => {
        const user = new User({
            firstName: 'Snow',
            lastName: 'White',
            email: 'mirrormirror@onthewall.com',
            password: 'fairestofthemall',
            isLoggedIn: true
        })
        await user.save()
        const token = await user.generateAuthToken()

        const response = await request(app)
            .put(`/users/${user._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ firstName: 'Evil', lastName: 'Queen'})
        
        expect(response.statusCode).toBe(200)
        expect(response.body.firstName).toEqual('Evil')
        expect(response.body.lastName).toEqual('Queen')
    })

    test('It should delete a user', async () => {
        const user = new User({
            firstName: 'Humpty',
            lastName: 'Dumpty',
            email: 'eggonawall@risky.com',
            password: 'allthekingshorses',
            isLoggedIn: true
        })
        await user.save()
        const token = await user.generateAuthToken()

        const response = await request(app)
            .delete(`/users/${user._id}`)
            .set('Authorization', `Bearer ${token}`)
        
        expect(response.statusCode).toBe(200)
        expect(response.body.message).toEqual('user deleted')

    })

    test('It should login a user', async () => {
        const user = new User({
            firstName: 'Little',
            lastName: 'Red', 
            email: 'suspiciousgrandma@woods.com',
            password: 'whatbigeyes'
        })
        await user.save()

        const response = await request(app)
            .post('/users/login')
            .send({ email: 'suspiciousgrandma@woods.com', password: 'whatbigeyes' })

        expect(response.statusCode).toBe(200)
        expect(response.body.user.firstName).toEqual('Little')
        expect(response.body.user.lastName).toEqual('Red')
        expect(response.body.user.email).toEqual('suspiciousgrandma@woods.com')
        expect(response.body.user.isLoggedIn).toEqual(true)
        expect(response.body).toHaveProperty('token')
    })

    test('It should logout a user', async () => {
        const user = new User({
            firstName: 'Pinocchio',
            lastName: 'Puppet', 
            email: 'realboy@nostrings.com',
            password: 'madeofwood',
            isLoggedIn: true
        })
        await user.save()
        const token = await user.generateAuthToken()

        const response = await request(app)
            .post('/users/logout')
            .set('Authorization', `Bearer ${token}`)

        expect(response.statusCode).toBe(200)
        expect(response.body.isLoggedIn).toEqual(false)
    })
})