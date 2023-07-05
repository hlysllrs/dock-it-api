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

})