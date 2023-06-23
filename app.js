const express = require('express')
const morgan = require('morgan')
// INSERT ROUTES IMPORTS HERE
const userRoutes = require('./routes/users')
// import teams routes
// import projects routes
// import tasks routes

const app = express()

app.use(express.json())
app.use(morgan('combined'))
// INSERT MIDDLEWARE FOR ROUTES HERE
app.use('/users', userRoutes)

module.exports = app