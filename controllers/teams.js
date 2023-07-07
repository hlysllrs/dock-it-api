const User = require('../models/user')
const TeamRole = require('../models/teamRole')
const Team = require('../models/team')
const ProjectRole = require('../models/projectRole')
const Project = require('../models/project')
const Task = require('../models/task')

/**
 * Checks if the user is a member of the given team
 * @method checkMember
 * @description used to check if the user making the request is a member of the team specified by req.params.teamId before excecuting the next function in the route's callbacks
 * @throws throws an error if the user is not a member of the team
 */
exports.checkMember = async (req, res, next) => {
    try {
        const team = await Team.findOne({ _id: req.params.teamId })
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
 * @description used to check if the user making the request is an admin of the team specified by req.params.teamId before excecuting the next function in the route's callbacks
 * @throws throws an error if the user is not an admin for the team
 */
exports.checkAdmin = async (req, res, next) => {
    try {
        const userRole = await TeamRole.findOne({ user: req.user._id, team: req.params.teamId })
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
 * @description adds a member to the team specified by req.params.teamId
 * 
 * Request will contain: 
 *  - member: (required) ObjectId of the user being added as a member to the team
 *  - role: (required) desired role for the new member  
 *      -- can either be 'admin' or 'contributor'
 */
exports.addTeamMember = async (req, res) => {
    try {
        // find team using req.params.teamId
        const team = await Team.findOne({ _id: req.params.teamId })
        // find user by _id
        const member = await User.findOne({ _id: req.body.member })
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
 * @description removes a member from the team specified by req.params.teamId
 * 
 * Request will contain: 
 *  - member: (required) ObjectId of the user being removed as a member of the team
 */
exports.removeTeamMember = async (req, res) => {
    try {
        // find team using req.params.teamId
        const team = await Team.findOne({ _id: req.params.teamId })
        // find member by _id
        const member = await User.findOne({ _id: req.body.member })
        // remove member from team's members array
        team.members.pull(member._id)
        await team.save()
        // delete member's teamRole for team
        const memberRole = await TeamRole.findOneAndDelete({ user: member._id, team: team._id })
        // remove deleted role from member's teams array
        member.teams.pull(memberRole._id)
        // find all team projects the member is assigned to
        const projects = await Project.find({ team: team._id, members: member._id })
        projects.forEach(async (project) => {
            // delete the member's projectRoles for the project
            const projectRole = await ProjectRole.findOneAndDelete({ user: member._id, project: project._id })
            // remove the projectRoles from the member's projects array
            member.projects.pull(projectRole._id)
            // find all tasks associated to the project the member is assigned to 
            const tasks = await Task.find({ project: project._id, assignedTo: member._id })
            tasks.forEach(async (task) => {
                // update each task to be unassigned
                task.assignedTo = null
                await task.save()
                // remove each task from the member's tasks array
                member.tasks.pull(task._id)
            })
        })
        await member.save()

        res.json({ team, memberRole, member })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Update team details for the given team
 * @method updateTeam
 * @description updates information of the team specified by req.params.teamId
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
        // find team using req.params.teamId
        const team = await Team.findOne({ _id: req.params.teamId })
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
 * @description deletes the team specified by req.params.teamId
 * 
 * Also removes the team reference from any users it was assigned to and deletes associated projects, projectRoles, and tasks for those projects
 */
exports.deleteTeam = async (req, res) => {
    try {
        // find team using req.params.teamId and delete
        const team = await Team.findOneAndDelete({ _id: req.params.teamId })

        // find all projects assigned to the team
        const teamProjects = await Project.find({ team: team._id })
        teamProjects.forEach(async (project) => {
            // find all tasks associated with each project
            const tasks = await Task.find({ project: project._id })
            // remove each associated task from assigned user's tasks array
            tasks.forEach(async (task) => {
                const userAssigned = await User.findOne({ _id: task.assignedTo })
                userAssigned.tasks.pull(task._id)
                await userAssigned.save()
            })
            // delete tasks
            await Task.deleteMany({ project: project._id })
            // find all project roles associated with the project
            const projectRoles = await ProjectRole.find({ project: project._id })
            // remove associated project role from each member's projects array
            projectRoles.forEach(async (role) => {
                const pMember = await User.findOne({ _id: role.user })
                pMember.projects.pull(role._id)
                await pMember.save()
            })
            // delete project roles
            await ProjectRole.deleteMany({ project: project._id })
        })
        // delete projects
        await Project.deleteMany({ team: team._id })

         // find all team roles associated with the team
         const teamRoles = await TeamRole.find({ team: team._id })
         // remove associated team role from each member's projects array
         teamRoles.forEach(async (role) => {
             const tMember = await User.findOne({ _id: role.user })
             tMember.teams.pull(role._id)
             await tMember.save()
         })
         // delete team roles
         await TeamRole.deleteMany({ team: team._id })

        res.json({ message: `${team.title} deleted` })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Show the given team's details
 * @method showTeamDetails
 * @description shows the details for the team specified by req.params.teamId. Details shown include title, description, and members' names.
 * 
 * To view all of the team's projects, please use the {@linkcode showTeamProjects} method provided.
 */
exports.showTeamDetails = async (req, res) => {
    try {
        const team = await Team.findOne({ _id: req.params.teamId })
            .populate('members', 'firstName lastName fullName')
            .exec()
        res.json(team)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Show the given team's projects
 * @method showTeamProjects
 * @description shows the projects for the team specified by req.params.teamId. Each project is populated with the details of its associated tasks and the user each task is assigned to.
 * 
 * To view the team's details, including a list of the team's members, please use the {@linkcode showTeamDetails} method provided.
 */
exports.showTeamProjects = async (req, res) => {
    try {
        // find team using req.params.teamId
        const team = await Team.findOne({ _id: req.params.teamId })
        // populate the team's projects
        .populate({ 
            path: 'projects', 
            // populate project's tasks with title, dueDate, assignedTo, and status
            populate: { 
                path: 'tasks', 
                select: 'title dueDate assignedTo status', 
                // populate name of person task is assigned to 
                populate: { 
                    path: 'assignedTo', 
                    select: 'firstName lastName fullName' 
                }
            }
        })
        .exec()
            
        res.json(team)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Show all of the user's teams and team projects
 * @method showAllTeams
 * @description shows the all teams and projects the user is a member of. Each project is populated with the details of its associated tasks and the user each task is assigned to.
 */
exports.showAllTeams = async (req, res) => {
    try {
        // find all of the user's team roles
        const teamRoles = await TeamRole.find({ user: req.user._id })
            // populate each team
            .populate({ 
                path: 'team',
                select: 'title description projects', 
                // populate the team's projects
                populate: {
                    path: 'projects', 
                    // populate project's tasks with title, dueDate, assignedTo, and status
                    populate: { 
                        path: 'tasks', 
                        select: 'title dueDate assignedTo status', 
                        // populate name of person task is assigned to 
                        populate: { 
                            path: 'assignedTo', 
                            select: 'firstName lastName fullName' 
                        }
                    }
                }
            })
            .exec()

        res.json({ teamRoles })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}