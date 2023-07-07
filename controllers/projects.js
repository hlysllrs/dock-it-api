const User = require('../models/user')
const ProjectRole = require('../models/projectRole')
const Project = require('../models/project')
const Team = require('../models/team')
const TeamRole = require('../models/teamRole')
const Task = require('../models/task')

/**
 * Checks if the user is a member of the given project
 * @method checkMember
 * @description used to check if the user making the request is a member of the project specified by req.params.projectId before excecuting the next function in the route's callbacks
 * @throws throws an error if the user is not a member of the project
 */
exports.checkMember = async (req, res, next) => {
    try {
        const project = await Project.findOne({ _id: req.params.projectId })
        if(!project.members.includes(req.user._id)) {
            throw new Error(`user is not a member of ${project.title}`)
        }
        next()
    } catch (error) {
        res.status(400).json({message: error.message })
    }
}

/**
 * Checks if the user is an admin for the given project
 * @method checkAdmin
 * @description used to check if the user making the request is an admin of the project specified by req.params.projectId before excecuting the next function in the route's callbacks
 * @throws throws an error if the user is not an admin for the project
 */
exports.checkAdmin = async (req, res, next) => {
    try {
        const userRole = await ProjectRole.findOne({ user: req.user._id, project: req.params.projectId })
        if(userRole.role !== 'admin') {
            throw new Error('user not authorized')
        }
        next()
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Create a new project
 * @method createProject
 * @description creates a new project
 * @throws throws an error when creating team projects if the user is not an admin for the team
 * 
 * Request will contain: 
 *  - title: (required) title of the project
 *  - description: description of the project
 *  - type: (required) type of project  
 *      -- can be 'personal' or 'team'
 *  - startDate: start date of the project  
 *      -- defaults to Date.now
 *  - endDate: (required) end date of the project
 *  - team: ObjectId of the team the project is assigned to (only if project type is 'team')
 * 
 * The user will automatically be assigned to an admin role for the project created
 */
exports.createProject= async (req, res) => {
    try {
        // if the project is a team project, check if the user is an admin for the team
        if(req.body.type === 'team'){
            const teamRole = await TeamRole.findOne({ user: req.user._id, team: req.body.team })
            if(teamRole.role !== 'admin') {
                throw new Error('user not authorized to create team projects')
            }
        }
        // create project
        const project = await Project.create(req.body)
        // assign admin role to user who created the project + add to user's projects array
        const projectRole = await ProjectRole.create({ user: req.user._id, role: 'admin', project: project._id })
        req.user.projects.addToSet({ _id: projectRole._id })
        await req.user.save()
        // add user to project's members array
        project.members.addToSet({ _id: req.user._id })
        await project.save()
        // if the project is a team project, add the project to the team's projects array
        if (project.type === 'team') {
            const team = await Team.findOne({ _id: req.body.team })
            team.projects.addToSet({ _id: project._id })
            await team.save()
        }
        res.json({ project, projectRole, user: req.user})
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Add a member to the given project
 * @method addProjectMember
 * @description adds a member to the project specified by req.params.projectId
 * 
 * Request will contain: 
 *  - member: (required) ObjectId of the user being added as a member to the project
 *  - role: (required) desired role for the new member  
 *      -- can either be 'admin' or 'contributor'
 */
exports.addProjectMember = async (req, res) => {
    try {
        // find project using req.params.projectId
        const project = await Project.findOne({ _id: req.params.projectId })
        // find user by _id
        const member = await User.findOne({ _id: req.body.member })
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

/**
 * Remove a member from the given project
 * @method removeProjectMember
 * @description removes a member from the project specified by req.params.projectId
 * 
 * Request will contain: 
 *  - member: (required) ObjectId of the user being removed as a member of the project
 */
exports.removeProjectMember = async (req, res) => {
    try {
        // find project using req.params.projectId
        const project = await Project.findOne({ _id: req.params.projectId })
        // find member by _id
        const member = await User.findOne({ _id: req.body.member })
        // remove member from project's members array
        project.members.splice(project.members.indexOf(member._id), 1)
        await project.save()
        // delete member's projectRole for project
        const memberRole = await ProjectRole.findOneAndDelete({ user: member._id, project: project._id })
        // remove deleted role from member's projects array
        member.projects.splice(member.projects.indexOf(memberRole._id), 1)
        // remove the member from all assigned tasks and remove tasks from member's tasks array
        const tasks = await Task.find({ project: project._id, assignedTo: member._id })
        tasks.forEach(async (task) => {
            task.assignedTo = null
            await task.save()
            member.tasks.splice(member.tasks.indexOf(task._id), 1)
        })
        member.save()
        res.json({ project, memberRole, member })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Update project details for the given project
 * @method updateProject
 * @description updates information of the project specified by req.params.projectId
 * 
 * Request may contain: 
 *  - title: title of the project
 *  - description: description of the project
 *  - startDate: start date of the project
 *  - endDate: end date of the project
 * 
 * For making changes to the project's members array, please use the {@linkcode addProjectMember} and {@linkcode removeProjectMember} methods provided.  
 * For making changes to the project's tasks array, please use the {@linkcode updateTask} or {@linkcode deleteTask} methods provided in the task controllers.  
 */
exports.updateProject = async (req, res) => {
    try {
        // find project using req.params.projectId
        const project = await Project.findOne({ _id: req.params.projectId })
        // make requested updates to project information
        const updates = Object.keys(req.body)
        updates.forEach(update => project[update] = req.body[update])
        await project.save()
        res.json(project)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Delete the given project
 * @method deleteProject
 * @description deletes the project specified by req.params.projectId
 * 
 * Also removes the project reference from any teams or users it was assigned to and deletes associated projectRoles and tasks
 */
exports.deleteProject = async (req, res) => {
    try {
        // find project using req.params.projectId
        const project = await Project.findOneAndDelete({ _id: req.params.projectId })
        // if project is a team project, remove from team's projects array
        if(project.type === 'team') {
            const team = await Team.findOne({ _id: project.team })
            team.projects.splice(team.projects.indexOf(project._id), 1)
            await team.save()
        }
        // find all project roles associated with the project
        const projectRoles = await ProjectRole.find({ project: project._id })
        // remove associated project role from each member's projects array
        projectRoles.forEach(async (role) => {
            const member = await User.findOne({ _id: role.user })
            member.projects.splice(member.projects.indexOf(role._id), 1)
            await member.save()
        })
        // delete project roles
        await ProjectRole.deleteMany({ project: project._id })
        // find all tasks associated with the project
        const tasks = await Task.find({ project: project._id })
        // remove associated task from each assigned user's tasks array
        tasks.forEach(async (task) => {
            const userAssigned = await User.findOne({ _id: task.assignedTo })
            userAssigned.tasks.splice(userAssigned.tasks.indexOf(task._id), 1)
            await userAssigned.save()
        })
        // delete tasks
        await Task.deleteMany({ project: project._id })

        res.json({ message: `${project.title} deleted` })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Show the given project
 * @method showProject
 * @description shows the project specified by req.params.projectId and populates associated task data
 */
exports.showProject = async (req, res) => {
    try {
        // find project using req.params.projectId
        const project = await Project.findOne({ _id: req.params.projectId })
            // populate task details
            .populate({ 
                path: 'tasks', 
                select: 'title dueDate assignedTo status', 
                // populate name of person task is assigned to 
                populate: { 
                    path: 'assignedTo', 
                    select: 'firstName lastName fullName' 
                }
            })
            .exec()
        res.json(project)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Show all of the user's personal projects
 * @method showAllPersonalProjects
 * @description shows all of a user's personal projects and populates associated task data
 */
exports.showPersonalProjects = async (req, res) => {
    try {
        // find all personal projects where user is a member
        const projects = await Project.find({ members: req.user.id, type: 'personal' })
        // populate task details
        .populate('tasks', 'title dueDate status')
        .exec()
        res.json({projects})
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}