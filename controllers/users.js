const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const secret = process.env.SECRET_KEY

// authenticate user
exports.auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const data = jwt.verify(token, secret)
        const user = await User.findOne({ _id: data._id })
        if(!user || !user.isLoggedIn) {
            throw new Error()
        }
        req.user = user
        next()
    } catch (error) {
        res.status(401).send('not authorized')
    }
}

// create a new user
exports.createUser = async (req, res) => {
    try {
        const user = new User(req.body)
        await user.save()
        const token = await user.generateAuthToken() // 🟥 CREATE TOKEN HERE OR NEED TO LOG IN AFTER CREATING??? 🟥
        res.json({ user, token })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// show a specific user
exports.showUser = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id }) // 🟥 CAN I USE REQ.USER HERE INSTEAD SINCE AUTH WAS RUN FIRST??? 🟥
        res.json(user)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// update a user
exports.updateUser = async (req, res) => {
    try {
        const updates = Object.keys(req.body)
        const user = await User.findOne({ _id: req.params.id }) // 🟥 CAN I USE REQ.USER HERE INSTEAD SINCE AUTH WAS RUN FIRST??? 🟥
        updates.forEach(update => user[update] = req.body[update])
        await user.save()
        res.json(user)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// delete a user
exports.deleteUser = async (req, res) => {
    try {
        await req.user.deleteOne()

          // 🟥 ALSO NEED TO DELETE ALL PERSONAL PROJECTS AND TASKS 🟥
          // 🟥 NEED TO REMOVE ALL TEAM ROLES AND PROJECT ROLES 🟥
          // 🟥 NEED TO REMOVE USER FROM ALL TEAMS AND TEAM PROJECTS 🟥
          // 🟥 UPDATE ANY ASSIGNED TASKS TO BE UNASSIGNED 🟥

        res.json({ message: 'user deleted' })
    } catch (error) {
        res.status(400).json({ message: error.message })
        
    }
}

// login a user
exports.loginUser = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email })
        if (!user || !await bcrypt.compare(req.body.password, user.password)) {
            res.status(400).send('invalid user credentials')
        } else {
            const token = await user.generateAuthToken()
            user.isLoggedIn = true
            await user.save()
            res.json({ user, token })
        }
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// logout a user
exports.logoutUser = async (req, res) => {
    try {
        const user = req.user
        user.isLoggedIn = false
        await user.save()
        res.json(user)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}