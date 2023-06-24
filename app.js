const express = require('express')
const morgan = require('morgan')
// INSERT ROUTES IMPORTS HERE
const userRoutes = require('./routes/users')
const teamRoutes = require('./routes/teams')
// import projects routes
// import tasks routes

const app = express()

app.use(express.json())
app.use(morgan('combined'))
// INSERT MIDDLEWARE FOR ROUTES HERE
app.use('/users', userRoutes)
app.use('/teams', teamRoutes)

module.exports = app