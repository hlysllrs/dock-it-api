require('dotenv').config()
const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../app')
const server = app.listen(8083, () => {
    console.log('testing on port 8083')
})
const User = require('../models/user')
const Team = require('../models/team')
const Project = require('../models/project')
const Task = require('../models/task')
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

describe('Test task endpoints', () => {
    test('It should create a team project', async () => {
        // create a logged in user and a token
        const user = new User({
            firstName: 'test3',
            lastName: 'test1',
            email: '1@test.com',
            password: 'testing123',
            isLoggedIn: true
        })
        await user.save()
        const token = await user.generateAuthToken()

        // send request with authorization and team info to create a team
        const createTeam = await request(app)
            .post('/teams')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'team2', 
                description: 'testing team 2'
            })

        const team = await Team.findOne({ title: 'team2', 
        description: 'testing team 2' })
        
        const response = await request(app)
            .post('/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'project1',
                description: 'testing project 1', 
                type: 'team', 
                endDate: '08/01/2023', 
                team: team._id
            })
        
        expect(response.statusCode).toBe(200)
        expect(response.body.project.title).toEqual('project1')
        expect(response.body.project.description).toEqual('testing project 1')
        expect(response.body.project.type).toEqual('team')
        expect(response.body.project.members).toContain(response.body.user._id)
        expect(response.body.projectRole.role).toEqual('admin')
        expect(response.body.projectRole.project).toEqual(response.body.project._id)
        expect(response.body.user.projects).toContain(response.body.projectRole._id)
    })
})