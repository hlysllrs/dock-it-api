require('dotenv').config()
const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../app')
const server = app.listen(8082, () => {
    console.log('testing on port 8082')
})
const User = require('../models/user')
const Team = require('../models/team')
const Project = require('../models/project')
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

describe('Test project endpoints', () => {
    test('It should create a team project', async () => {
        // create a logged in user and a token
        const user = new User({
            firstName: 'test3',
            lastName: 'test3',
            email: '3@test.com',
            password: 'testing123',
            isLoggedIn: true
        })
        await user.save()
        const token = await user.generateAuthToken()

        // create a team where user is an admin
        await request(app)
            .post('/teams')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'team2', 
                description: 'testing team 2'
            })
        // find the newly cresated team
        const team = await Team.findOne({ title: 'team2', 
        description: 'testing team 2' })

        const response = await request(app)
            .post('/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'project1 team',
                description: 'testing project 1', 
                type: 'team', 
                endDate: '08/01/2023', 
                team: team._id
            })
        
        expect(response.statusCode).toBe(200)
        expect(response.body.project.title).toEqual('project1 team')
        expect(response.body.project.description).toEqual('testing project 1')
        expect(response.body.project.type).toEqual('team')
        expect(response.body.project.members).toContain(response.body.user._id)
        expect(response.body.projectRole.role).toEqual('admin')
        expect(response.body.projectRole.project).toEqual(response.body.project._id)
        expect(response.body.user.projects).toContain(response.body.projectRole._id)
    })

    test('It should create a personal project', async () => {
        // create a logged in user and a token
        const user = await User.findOne({ email: '3@test.com' })
        await user.save()
        const token = await user.generateAuthToken()

        const response = await request(app)
            .post('/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'project2 personal',
                description: 'testing project 2', 
                type: 'personal', 
                endDate: '08/01/2023', 
            })
        
        expect(response.statusCode).toBe(200)
        expect(response.body.project.title).toEqual('project2 personal')
        expect(response.body.project.description).toEqual('testing project 2')
        expect(response.body.project.type).toEqual('personal')
        expect(response.body.project.members).toContain(response.body.user._id)
        expect(response.body.projectRole.role).toEqual('admin')
        expect(response.body.projectRole.project).toEqual(response.body.project._id)
        expect(response.body.user.projects).toContain(response.body.projectRole._id)
    })

    test('It should add a member to a project', async () => {
        // find user by email and create a new token
        const user = await User.findOne({ email: '3@test.com' })
        const token = await user.generateAuthToken()
        // find project for member to be added to
        const project = await Project.findOne({ title: 'project1 team', description: 'testing project 1' })
        // find team for member to be added (must be team member to be added to a team project)
        const team = await Team.findOne({ title: 'team2', description: 'testing team 2'})
        // create member to be added to the project
        const newMember = new User({
            firstName: 'test4',
            lastName: 'test4',
            email: '4@test.com',
            password: 'testing123',
        })
        await newMember.save()
        // add member to the team
        await request(app)
            .put(`/teams/add/${team._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                member: newMember._id, 
                role: 'contributor'
            })

        // send request with authorization and new member's _id and project role
        const response = await request(app)
            .put(`/projects/add/${project._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                member: newMember._id, 
                role: 'contributor'
            })
        expect(response.statusCode).toBe(200)
        expect(response.body.project.members).toContain(response.body.member._id)
        expect(response.body.memberRole.user).toEqual(response.body.member._id)
        expect(response.body.memberRole.role).toEqual('contributor')
        expect(response.body.memberRole.project).toEqual(response.body.project._id)
        expect(response.body.member.projects).toContain(response.body.memberRole._id)
    })

    test('It should remove a member from a project', async () => {
        // find user by email and create a new token
        const user = await User.findOne({ email: '3@test.com' })
        const token = await user.generateAuthToken()
        // find project for member to be removed from
        const project = await Project.findOne({ title: 'project1 team', description: 'testing project 1' })
        // find member to be removed from the project
        const member = await User.findOne({ email: '4@test.com' })
        // send request with authorization and new member's _id and role
        const response = await request(app)
            .put(`/projects/remove/${project._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                member: member._id
            })

        expect(response.statusCode).toBe(200)
        expect(response.body.project.members).not.toContain(response.body.member._id)
        expect(response.body.memberRole.user).toEqual(response.body.member._id)
        expect(response.body.member.projects).not.toContain(response.body.memberRole._id)
    })

    test('It should update a project', async () => {
        // find user by email and create a new token
        const user = await User.findOne({ email: '3@test.com' })
        const token = await user.generateAuthToken()
        // find project to be updated
        const project = await Project.findOne({ title: 'project1 team', description: 'testing project 1' })
        // send request with authorization and updated project details
        const response = await request(app)
            .put(`/projects/${project._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'project1 updated',
                description: 'updated testing project 1'
            })
        
        expect(response.statusCode).toBe(200)
        expect(response.body.title).toEqual('project1 updated')
        expect(response.body.description).toEqual('updated testing project 1')
    })

    // 🟥 TEST FOR SHOWING A PROJECT 🟥
    test('It should show all a project', async () => {

    })

    // 🟥 TEST FOR SHOWING All OF THE USER'S PERSONAL PROJECTS 🟥
    test('It should show all of the user\'s personal projects', async () => {

    })

    test('It should delete a project', async () => {
        // find user by email and create a new token
        const user = await User.findOne({ email: '3@test.com' })
        const token = await user.generateAuthToken()
        // find project to be deleted
        const project = await Project.findOne({ title: 'project1 updated', description: 'updated testing project 1' })
        // send request with authorization
        const response = await request(app)
            .delete(`/projects/${project._id}`)
            .set('Authorization', `Bearer ${token}`)

        expect(response.statusCode).toBe(200)
        expect(response.body.message).toEqual(`${project.title} deleted`)
    })
})