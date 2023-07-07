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
    test('It should create a task', async () => {
        // create a logged in user and a token
        const user = new User({
            firstName: 'test5',
            lastName: 'test5',
            email: '5@test.com',
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
                title: 'team3', 
                description: 'testing team 3'
            })
        // find the newly created team
        const team = await Team.findOne({ title: 'team3', description: 'testing team 3' })
        
        // create a project for tasks to be added to
        await request(app)
            .post('/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'project3',
                description: 'testing project 3', 
                type: 'team', 
                endDate: '08/01/2023', 
                team: team._id
            })
        // find the newly created project 
        const project = await Project.findOne({ title: 'project3', description: 'testing project 3' })
        
        // send request with authorization and task details
        const response = await request(app)
        .post(`/projects/${project._id}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({
            title: 'task1',
            dueDate: '07/08/2023', 
            project: project._id,
            assignedTo: user._id
        })
    
        expect(response.statusCode).toBe(200)
        expect(response.body.task.title).toEqual('task1')
        expect(response.body.task.dueDate).toEqual('2023-07-08T04:00:00.000Z')
        expect(response.body.task.status).toEqual('Not Started')
        expect(response.body.task.assignedTo).toEqual(response.body.userAssigned._id)
        expect(response.body.project.tasks).toContain(response.body.task._id)
        expect(response.body.userAssigned.tasks).toContain(response.body.task._id)
    })

    test('It should update a task', async () => {
        // find user by email and create a new token
        const user = await User.findOne({ email: '5@test.com' })
        const token = await user.generateAuthToken()
        // find project task belongs to
        const project = await Project.findOne({ title: 'project3', description: 'testing project 3' })
        // find task to be updated
        const task = await Task.findOne({ title: 'task1', dueDate: '07/08/2023' })
        // send request with authorization and updated task details
        const response = await request(app)
            .put(`/projects/${project._id}/tasks/${task._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'task1 updated',
                dueDate: '07/30/2023'
            })
        
        expect(response.statusCode).toBe(200)
        expect(response.body.title).toEqual('task1 updated')
        expect(response.body.dueDate).toEqual('2023-07-30T04:00:00.000Z')
    })

    test('It should reassign a task', async () => {
        // find user by email and create a new token
        const user = await User.findOne({ email: '5@test.com' })
        const token = await user.generateAuthToken()
        // find task to be reassigned
        const task = await Task.findOne({ title: 'task1 updated', dueDate: '07/30/2023' })
        // find project task belongs to
        const project = await Project.findOne({ title: 'project3', description: 'testing project 3' })
        // find team project belongs to
        const team = await Team.findOne({ title: 'team3', description: 'testing team 3' })
        // create user for task to be reassigned to
        const newUser = new User({
            firstName: 'test6',
            lastName: 'test6',
            email: '6@test.com',
            password: 'testing123',
            isLoggedIn: true
        })
        await newUser.save()
        // add the new user as a member of the team
        await request(app)
            .put(`/teams/add/${team._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                member: newUser._id, 
                role: 'contributor'
            })
        // add the new user as a member of the project
        await request(app)
            .put(`/projects/add/${project._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                member: newUser._id, 
                role: 'contributor'
            })
        // send request with authorization and updated task assignment
        const response = await request(app)
            .put(`/projects/${project._id}/tasks/reassign/${task._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                assignedTo: newUser._id
            })
        
        expect(response.statusCode).toBe(200)
        expect(response.body.task.assignedTo).toEqual(response.body.newAssigned._id)
        expect(response.body.newAssigned.tasks).toContain(response.body.task._id)
        expect(response.body.prevAssigned.tasks).not.toContain(response.body.task._id)
    })

    test('It should update a task\'s status', async () => {
        // find user by email and create a new token
        const user = await User.findOne({ email: '6@test.com' })
        const token = await user.generateAuthToken()
        // find project task belongs to
        const project = await Project.findOne({ title: 'project3', description: 'testing project 3' })
        // find task to be updated
        const task = await Task.findOne({ title: 'task1 updated', dueDate: '07/30/2023' })
        // send request with authorization and updated task status
        const response = await request(app)
            .put(`/projects/${project._id}/tasks/status/${task._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                status: 'Complete'
            })
        
        expect(response.statusCode).toBe(200)
        expect(response.body.title).toEqual('task1 updated')
        expect(response.body.status).toEqual('Complete')
    })

    test('It should delete a task', async () => {
        // find user by email and create a new token
        const user = await User.findOne({ email: '5@test.com' })
        const token = await user.generateAuthToken()
        // find task to be deleted
        const task = await Task.findOne({ title: 'task1 updated', dueDate: '07/30/2023' })
        // find project task belongs to
        const project = await Project.findOne({ title: 'project3', description: 'testing project 3' })
        // send request with authorization
        const response = await request(app)
            .delete(`/projects/${project._id}/tasks/${task._id}`)
            .set('Authorization', `Bearer ${token}`)

        expect(response.statusCode).toBe(200)
        expect(response.body.message).toEqual(`${task.title} deleted`)
    })
})