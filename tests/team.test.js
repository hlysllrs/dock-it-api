require('dotenv').config()
const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../app')
const server = app.listen(8081, () => {
    console.log('testing on port 8081')
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

describe('Test team endpoints', () => {
    test('It should create a team', async () => {
        // create a logged in user and a token
        const user = new User({
            firstName: 'test1',
            lastName: 'test1',
            email: '1@test.com',
            password: 'testing123',
            isLoggedIn: true
        })
        await user.save()
        const token = await user.generateAuthToken()

        // send request with authorization and team info
        const response = await request(app)
            .post('/teams')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'team1', 
                description: 'testing team 1'
            })
        
        expect(response.statusCode).toBe(200)
        expect(response.body.team.title).toEqual('team1')
        expect(response.body.team.description).toEqual('testing team 1')
        expect(response.body.teamRole.role).toEqual('admin')
        expect(response.body.teamRole.team).toEqual(response.body.team._id)
        expect(response.body.user.teams).toContain(response.body.teamRole._id)
    })
})