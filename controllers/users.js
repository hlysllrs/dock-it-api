const User = require('../models/user')
const ProjectRole = require('../models/projectRole')
const Project = require('../models/project')
const Team = require('../models/team')
const TeamRole = require('../models/teamRole')
const Task = require('../models/task')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const secret = process.env.SECRET_KEY

/**
 * Authenticate a user
 * @method auth
 * @description Authenticates a user's token and check that user is logged in before excecuting the next function in the route's callbacks
 * @throws throws an error if the user's token can not be verified or if the user is not logged in
 * 
 * Also saves the user's information to `req.user` for use in the remaining functions in the route's callbacks
 */
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

/**
 * Create a new user
 * @method createUser
 * @description creates a new user
 * 
 * Request will contain: 
 *  - firstName: (required) new user's first name
 *  - lastName: (required) new user's last name
 *  - email: (required) new user's email address
 *  - password: (required) new user's password - must be at least 8 characters
 * 
 * Note: user must login after creating an account. Authentication token is generated upon login. 
 */
exports.createUser = async (req, res) => {
    try {
        const user = new User(req.body)
        await user.save()
        res.json(user)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Show a specific user
 * @method showUser
 * @description shows the details for the user specified by req.params.userId.
 */
exports.showUser = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.userId })
        res.json(user)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Update user details for the given user
 * @method updateUser
 * @description updates information of the user specified by req.params.userId
 * 
 * Request may contain: 
 *  - firstName: user's first name
 *  - lastName: user's last name
 *  - email: user's email address
 *  - password: user's password - must be at least 8 characters
 * 
 * For making changes to the user's teams array, please use the {@linkcode addTeamMember} or {@linkcode removeTeamMember} methods provided in the teams controllers.  
 * For making changes to the user's projects array, please use the {@linkcode addProjectMamber} or {@linkcode removProjectMember} methods provided in the projects controllers. 
 */
exports.updateUser = async (req, res) => {
    try {
        const updates = Object.keys(req.body)
        updates.forEach(update => req.user[update] = req.body[update])
        await req.user.save()
        res.json(req.user)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Delete the given user
 * @method deleteUser
 * @description deletes the user specified by req.params.userId
 * 
 * Also removes the user reference from any teams, projects, or tasks they were assigned to and deletes associated projectRoles, teamRoles and personal projects. 
 */
exports.deleteUser = async (req, res) => {
    try {
        // find all of the user's personal projects
        const personalProjects = await Project.find({ type: 'personal', members: req.user._id })
        // delete each project and associated roles and tasks
        personalProjects.forEach(async (project) => {
        // find all project roles associated with the project
        const projectRoles = await ProjectRole.find({ project: project._id })
        // remove associated project role from each member's projects array
        projectRoles.forEach(async (role) => {
            const member = await User.findOne({ _id: role.user })
            member.projects.pull(role._id)
            await member.save()
        })
        // delete project roles
        await ProjectRole.deleteMany({ project: project._id })
        // find all tasks associated with the project
        const tasks = await Task.find({ project: project._id })
        // remove associated task from each assigned user's tasks array
        tasks.forEach(async (task) => {
            const userAssigned = await User.findOne({ _id: task.assignedTo })
            userAssigned.tasks.pull(task._id)
            await userAssigned.save()
        })
        // delete tasks
        await Task.deleteMany({ project: project._id })
        })

        // find all teams where user is a member
        const teams = await Team.find({ members: req.user._id })
        // remove user from each team, delete team roles, remove user from team's projects, delete project roles, and update tasks to be unassigned
        teams.forEach(async (team) => {
            // remove member from team's members array
            team.members.pull(req.user._id)
            await team.save()
            // delete member's teamRole for team
            const memberRole = await TeamRole.findOneAndDelete({ user: req.user._id, team: team._id })
            // find all team projects the member is assigned to
            const projects = await Project.find({ team: team._id, members: req.user._id })
            projects.forEach(async (project) => {
                // delete the member's projectRoles for the project
                const projectRole = await ProjectRole.findOneAndDelete({ user: req.user._id, project: project._id })
                // find all tasks associated to the project the member is assigned to 
                const tasks = await Task.find({ project: project._id, assignedTo: req.user._id })
                tasks.forEach(async (task) => {
                    // update each task to be unassigned
                    task.assignedTo = null
                    await task.save()
                })              
            })
        })
        // delete the user
        await req.user.deleteOne()

        res.json({ message: 'user deleted' })
    } catch (error) {
        res.status(400).json({ message: error.message })
        
    }
}

/**
 * Login a user
 * @method loginUser
 * @description used to log a user in to the application
 * @throws throws an error if the user is not found in the database or if the password entered is incorrect
 * 
 * Request will contain: 
 *  - email: (required) user's email address
 *  - password: (required) user's password
 */
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

/**
 * Logout a user
 * @method logoutUser
 * @description used to log a user out of the application
 */
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