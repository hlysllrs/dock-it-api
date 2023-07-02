const User = require('../models/user')
const TeamRole = require('../models/teamRole')
const Team = require('../models/team')
const ProjectRole = require('../models/projectRole')
const Project = require('../models/project')

/**
 * Checks if the user is a member of the given team
 * @method checkMember
 * @description used to check if the user making the request is a member of the team specified by `req.params.id` before excecuting the next function in the route's callbacks
 * @throws throws an error if the user is not a member of the team
 */
exports.checkMember = async (req, res, next) => {
    try {
        const team = await Team.findOne({ _id: req.params.id })
        if(!team.members.includes(req.user._id)) {
            throw new Error(`user is not a member of ${team.title}`)
        }
        next()
    } catch (error) {
        res.status(400).json({message: error.message })
    }
}

/**
 * Checks if the user is an admin for the given team
 * @method checkAdmin
 * @description used to check if the user making the request is an admin of the team specified by `req.params.id` before excecuting the next function in the route's callbacks
 * @throws throws an error if the user is not an admin for the team
 */
exports.checkAdmin = async (req, res, next) => {
    try {
        const userRole = await TeamRole.findOne({ user: req.user._id, team: req.params.id })
        if(userRole.role !== 'admin') {
            throw new Error('user not authorized')
        }
        next()
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Create a new team
 * @method createTeam
 * @description creates a new team
 * 
 * Request will contain: 
 *  - title: (required) title of the team
 *  - description: description of the team
 * 
 * The user will automatically be assigned to an admin role for the team created
 */
exports.createTeam = async (req, res) => {
    try {
        // create team
        const team = await Team.create(req.body)
        // assign admin role to user who created the team + add to user's teams array
        const teamRole = await TeamRole.create({ user: req.user._id, role: 'admin', team: team._id })
        req.user.teams.addToSet({ _id: teamRole._id })
        await req.user.save()
        // add user to team's members array
        team.members.addToSet({ _id: req.user._id })
        await team.save()
        res.json({ team, teamRole, user: req.user})
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Add a member to the given team
 * @method addTeamMember
 * @description adds a member to the team specified by `req.params.id`
 * 
 * Request will contain: 
 *  - member: (required) ObjectId of the user being added as a member to the team
 *  - role: (required) desired role for the new member  
 *      -- can either be 'admin' or 'contributor'
 */
exports.addTeamMember = async (req, res) => {
    try {
        // find team using req.params.id
        const team = await Team.findOne({ _id: req.params.id })
        // find user by _id
        const member = await User.findOne({ _id: req.body._id })
        team.members.addToSet({ _id: member._id})
        await team.save()
        // create role for new member
        const memberRole = await TeamRole.create({ user: member._id, role: req.body.role, team: team._id })
        // add role to new member's teams array
        member.teams.addToSet({ _id: memberRole._id })
        await member.save()
        res.json({ team, memberRole, member })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Remove a member from the given team
 * @method removeTeamMember
 * @description removes a member from the team specified by `req.params.id`
 * 
 * Request will contain: 
 *  - member: (required) ObjectId of the user being removed as a member of the team
 */
exports.removeTeamMember = async (req, res) => {
    try {
        // find team using req.params.id
        const team = await Team.findOne({ _id: req.params.id })
        // find member by _id
        const member = await User.findOne({ _id: req.body._id })
        // remove member from team's members array
        team.members.splice(team.members.indexOf(member._id), 1)
        await team.save()
        // delete member's teamRole for team
        const memberRole = await TeamRole.findOneAndDelete({ user: member._id, team: team._id })
        // remove deleted role from member's teams array
        member.teams.splice(member.teams.indexOf(memberRole._id), 1)
        member.save()

        // 🟥 ALSO NEED TO REMOVE THE MEMBER FROM ALL ASSOCIATED PROJECTS AND TASKS 🟥

        res.json({ team, member })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Update project details for the given team
 * @method updateTeam
 * @description updates information of the team specified by `req.params.id`
 * 
 * Request may contain: 
 *  - title: title of the team
 *  - description: description of the team
 * 
 * For making changes to the team's members array, please use the {@linkcode addTeamMember} or {@linkcode removeTeamMember} methods provided.  
 * For making changes to the team's projects array, please use the {@linkcode updateProject} or {@linkcode deleteProject} methods provided in the project controllers.  
 */
exports.updateTeam = async (req, res) => {
    try {
        // find team using req.params.id
        const team = await Team.findOne({ _id: req.params.id })
        // make requested updates to team information
        const updates = Object.keys(req.body)
        updates.forEach(update => team[update] = req.body[update])
        await team.save()
        res.json(team)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Delete the given team
 * @method deleteTeam
 * @description deletes the team specified by `req.params.id`
 * 
 * Also removes the team reference from any users it was assigned to and deletes associated projects, projectRoles, and tasks for those projects
 */
exports.deleteTeam = async (req, res) => {
    try {
        // find team using req.params.id and delete
        const team = await Team.findOneAndDelete({ _id: req.params.id })
        // find all team roles associated with the team
        const teamRoles = await TeamRole.find({ team: team._id })
        // remove associated team role from each member's projects array
        teamRoles.forEach(async (role) => {
            const member = await User.find({ _id: role.user })
            member.teams.splice(member.teams.indexOf(role._id), 1)
            await member.save()
        })
        // delete team roles
        teamRoles.deleteMany()

        // delete projects assigned to the team
        const teamProjects = await Project.find({ team: team._id })
        teamProjects.forEach(async (project) => {
            // find all project roles associated with the project
            const projectRoles = await ProjectRole.find({ project: project._id })
            // remove associated project role from each member's projects array
            projectRoles.forEach(async (role) => {
                const member = await User.find({ _id: role.user })
                member.projects.splice(member.projects.indexOf(role._id), 1)
                await member.save()
        })
            // delete project roles
            projectRoles.deleteMany()

            // 🟥 ALSO NEED TO DELETE ALL ASSOCIATED TASKS 🟥
        })


        res.json({ message: `${team.title} deleted` })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// show a team's info
exports.showTeamProjects = async (req, res) => {
    try {
        // find team using req.params.id, then populate the team's projects
        const team = await Team.findOne({ _id: req.params.id }).populate('projects').exec()
        team.projects.populate('tasks', 'title dueDate status')
        res.json(team)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Show the given team's details
 * @method showTeamDetails
 * @description shows the details for the team specified by `req.params.id`. Details shown include title, description, and members' names.
 * 
 * To view all of the team's projects, please use the {@linkcode showTeamProjects} method provided.
 */
exports.showTeamDetails = async (req, res) => {
    try {
        const team = await Team.findOne({ _id: req.params.id })
            .populate('members', 'firstName lastName fullName')
            .exec()
        res.json(team)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// show all of a user's teams
exports.showAllTeams = async (req, res) => {
    try {
        const teamRoles = await TeamRole.find({ user: req.user._id })
            .populate('team', 'title description projects')
            .exec()
        teamRoles.team.populate('projects', 'title startDate endDate tasks')
        teamRoles.team.projects.populate('tasks', 'title dueDate assignedTo status')
        teamRoles.team.projects.tasks.populate('assignedTo', 'firstName lastName fullName')

        res.json({ teamRoles })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// 🟥 METHOD FOR CHANGING A MEMBER'S ROLE?? 🟥