const express = require('express')
const morgan = require('morgan')

const userRoutes = require('./routes/users')
const teamRoutes = require('./routes/teams')
const projectRoutes = require('./routes/projects')
const taskRoutes = require('./routes/tasks')

const app = express()

app.use(express.json())
app.use(morgan('combined'))

app.use('/users', userRoutes)
app.use('/teams', teamRoutes)
app.use('/projects', projectRoutes)

module.exports = app