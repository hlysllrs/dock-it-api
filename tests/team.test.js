require('dotenv').config()
const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../app')
const server = app.listen(8081, () => {
    console.log('testing on port 8081')
})
const User = require('../models/user')
const Team = require('../models/team')
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

    test('It should add a member to a team', async () => {
        // find user by email and create a new token
        const user = await User.findOne({ email: '1@test.com' })
        const token = await user.generateAuthToken()
        // find team for member to be added
        const team = await Team.findOne({ title: 'team1', description: 'testing team 1'})
        // create member to be added to team
        const newMember = new User({
            firstName: 'test2',
            lastName: 'test2',
            email: '2@test.com',
            password: 'testing123',
        })
        await newMember.save()
        // send request with authorization and new member's _id and team role
        const response = await request(app)
            .put(`/teams/add/${team._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                member: newMember._id, 
                role: 'contributor'
            })
        expect(response.statusCode).toBe(200)
        expect(response.body.team.members).toContain(response.body.member._id)
        expect(response.body.memberRole.user).toEqual(response.body.member._id)
        expect(response.body.memberRole.role).toEqual('contributor')
        expect(response.body.memberRole.team).toEqual(response.body.team._id)
        expect(response.body.member.teams).toContain(response.body.memberRole._id)
    })

    test('It should remove a member from a team', async () => {
        // find user by email and create a new token
        const user = await User.findOne({ email: '1@test.com' })
        const token = await user.generateAuthToken()
        // find team for member to be removed
        const team = await Team.findOne({ title: 'team1', description: 'testing team 1'})
        // find member to be removed from team
        const member = await User.findOne({ email: '2@test.com' })
        // send request with authorization and removed member's _id
        const response = await request(app)
            .put(`/teams/remove/${team._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                member: member._id
            })

        expect(response.statusCode).toBe(200)
        expect(response.body.team.members).not.toContain(response.body.member._id)
        expect(response.body.memberRole.user).toEqual(response.body.member._id)
        expect(response.body.member.teams).not.toContain(response.body.memberRole._id)
    })

    test('It should update a team', async () => {
        // find user by email and create a new token
        const user = await User.findOne({ email: '1@test.com' })
        const token = await user.generateAuthToken()
        // find team to be updated
        const team = await Team.findOne({ title: 'team1', description: 'testing team 1'})
        // send request with authorization and updated team details
        const response = await request(app)
            .put(`/teams/${team._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'team1 updated',
                description: 'updated testing team 1'
            })

        expect(response.statusCode).toBe(200)
        expect(response.body.title).toEqual('team1 updated')
        expect(response.body.description).toEqual('updated testing team 1')
    })

    test('It should show a team\'s details', async () => {
        // find user by email and create a new token
        const user = await User.findOne({ email: '1@test.com' })
        const token = await user.generateAuthToken()
        // find team to be shown
        const team = await Team.findOne({ title: 'team1 updated', description: 'updated testing team 1'})
        // send request with authorization and updated team details
        const response = await request(app)
            .get(`/teams/${team._id}`)
            .set('Authorization', `Bearer ${token}`)

        expect(response.statusCode).toBe(200)
        expect(response.body.title).toEqual('team1 updated')
        expect(response.body.description).toEqual('updated testing team 1')
        expect(response.body.members[0].firstName).toEqual('test1')
        expect(response.body.members[0].lastName).toEqual('test1')
        expect(response.body.members[0].fullName).toEqual('test1 test1')
    })

    // 🟥 TEST FOR SHOWING A TEAM'S PROJECTS 🟥
    test('It should show all of a team\'s projects', async () => {

    })

    // 🟥 TEST FOR SHOWING All TEAMS AND THEIR PROJECTS 🟥
    test('It should show all of the user\'s teams and team projects projects', async () => {

    })

    test('It should delete a team', async () => {
        // find user by email and create a new token
        const user = await User.findOne({ email: '1@test.com' })
        const token = await user.generateAuthToken()
        // find team to be deleted
        const team = await Team.findOne({ title: 'team1 updated', description: 'updated testing team 1'})
        // send request with authorization
        const response = await request(app)
            .delete(`/teams/${team._id}`)
            .set('Authorization', `Bearer ${token}`)

        expect(response.statusCode).toBe(200)
        expect(response.body.message).toEqual(`${team.title} deleted`)
    })
})