const User = require('../models/user')
const TeamRole = require('../models/teamRole')
const Team = require('../models/team')

// check if user is a member of the given team
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

// check if user is an admin of the given team
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

// create a new team
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
// add new team member - request contains new member's _id and role on the team. { _id: '[INSERT ID]', role: '[INSERT ROLE NAME]' }
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

// remove team member - request contains removed member's _id { _id: '[INSERT ID]' }
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
        res.json({ team, member })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// update team details - title, description, etc.
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

// delete team
exports.deleteTeam = async (req, res) => {
    try {
        // find team using req.params.id
        const team = await Team.findOneAndDelete({ _id: req.params.id })
        res.json({ message: `${team.title} deleted` })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

exports.showTeam = async (req, res) => {
    try {
        // find team using req.params.id
        const team = await Team.findOne({ _id: req.params.id })
        team.populate() // 🟥 POPULATE TEAM MEMBERS FULL NAMES AND PROJECT TITLES 🟥
        res.json(team)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// METHOD FOR CHANGIGN A MEMBER'S ROLE??

// SHOW ALL A USER'S TEAMS

// SHOW A LIST OF ALL EXISTING TEAMS??