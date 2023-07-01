const User = require('../models/user')
const ProjectRole = require('../models/projectRole')
const Project = require('../models/project')

// check if user is a member of the given project
// 🟥 WILL A PROJECT NEED TO HAVE MEMBERS??? 🟥
exports.checkMember = async (req, res, next) => {
    try {
        const project = await Project.findOne({ _id: req.params.id })
        if(!project.members.includes(req.user._id)) {
            throw new Error(`user is not a member of ${project.title}`)
        }
        next()
    } catch (error) {
        res.status(400).json({message: error.message })
    }
}

// check if user is an admin of the given project
exports.checkAdmin = async (req, res, next) => {
    try {
        const userRole = await ProjectRole.findOne({ user: req.user._id, project: req.params.id })
        if(userRole.role !== 'admin') {
            throw new Error('user not authorized')
        }
        next()
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// create a new project
exports.createProject= async (req, res) => {
    try {
        // create project
        const project = await Project.create(req.body)
        // assign admin role to user who created the project + add to user's projects array
        const projectRole = await ProjectRole.create({ user: req.user._id, role: 'admin', project: project._id })
        req.user.projects.addToSet({ _id: projectRole._id })
        await req.user.save()
        // add user to project's members array
        project.members.addToSet({ _id: req.user._id })
        await project.save()
        res.json({ project, projectRole, user: req.user})
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// 🟥 WILL A PROJECT NEED TO HAVE MEMBERS??? 🟥
// add new project member - request contains new member's _id and role on the project. { _id: '[INSERT ID]', role: '[INSERT ROLE NAME]' }
exports.addProjectMember = async (req, res) => {
    try {
        // find project using req.params.id
        const project = await Project.findOne({ _id: req.params.id })
        // find user by _id
        const member = await User.findOne({ _id: req.body._id })
        project.members.addToSet({ _id: member._id})
        await project.save()
        // create role for new member
        const memberRole = await ProjectRole.create({ user: member._id, role: req.body.role, project: project._id })
        // add role to new member's projects array
        member.projects.addToSet({ _id: memberRole._id })
        await member.save()
        res.json({ project, memberRole, member })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// remove project member - request contains removed member's _id { _id: '[INSERT ID]' }
exports.removeProjectMember = async (req, res) => {
    try {
        // find project using req.params.id
        const project = await Project.findOne({ _id: req.params.id })
        // find member by _id
        const member = await User.findOne({ _id: req.body._id })
        // remove member from project's members array
        project.members.splice(project.members.indexOf(member._id), 1)
        await project.save()
        // delete member's projectRole for project
        const memberRole = await ProjectRole.findOneAndDelete({ user: member._id, project: project._id })
        // remove deleted role from member's projects array
        member.projects.splice(member.projects.indexOf(memberRole._id), 1)
        member.save()
        res.json({ project, member })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// update project details - title, description, start date, end date, etc.
exports.updateProject = async (req, res) => {
    try {
        // find project using req.params.id
        const project = await Project.findOne({ _id: req.params.id })
        // make requested updates to project information
        const updates = Object.keys(req.body)
        updates.forEach(update => project[update] = req.body[update])
        await project.save()
        res.json(project)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// delete project
exports.deleteProject = async (req, res) => {
    try {
        // find project using req.params.id
        const project = await Project.findOneAndDelete({ _id: req.params.id })
        res.json({ message: `${project.title} deleted` })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

exports.showProject = async (req, res) => {
    try {
        // find project using req.params.id
        const project = await Project.findOne({ _id: req.params.id })
        // populate task details
            .populate('tasks', 'title dueDate assignedTo status')
            .exec()
        // populate name of person task is assigned to 
        project.tasks.populate('assignedTo', 'firstName lastName fullName')
        res.json(project)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// show all of the user's personal projects
exports.showPersonalProjects = async (req, res) => {
    try {
        // find all personal projects where user is a member
        const projects = await Project.find({members: { contains: req.user.id }, type: 'personal'})
        // populate task details
        .populate('tasks', 'title dueDate assignedTo status')
        .exec()
        res.json({projects})
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// 🟥 METHOD FOR CHANGING A MEMBER'S ROLE?? 🟥