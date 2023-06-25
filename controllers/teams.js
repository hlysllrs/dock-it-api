const User = require('../models/user')
const TeamRole = require('../models/teamRole')
const Team = require('../models/team')

// check team role of user making the request
exports.checkRole = async (req, res, next) => {
    try {
        // find requested team
        const team = await Team.findOne({ _id: req.params.id })
        // find user making the request
        const user = await User.findOne({ _id: req.user._id })
            // populate their teams array with their role on the requested team
            .populate({ path: 'teams', match: {'team': team._id }})
        // get role name
        const role = user.teams[0].role
        console.log(role)
        // save role name to req.user.role for verification
        req.user.role = role
        next()
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

exports.createTeam = async (req, res) => {
    try {
        console.log(req.user)
        // create team
        const team = new Team(req.body) // will receive title and description
        await team.save()
        // assign admin role to user who created the team + add to user's teams array
        const teamRole = await TeamRole.create({ role: 'admin', team: team._id })
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
// add new team member by sending post request containing new member's email and role on the team. { email: '[INSERT EMAIL]', role: '[INSERT ROLE NAME]' }
exports.addTeamMember = async (req, res) => {
    try {
        // check if user making the request has authority to add members
        if(req.user.role !== ('admin' || 'leader')) {
            throw new Error('user not authorized')
        }
        // find team by id in url
        const team = await Team.findOne({ _id: req.params.id })
        // find user by email
        const newMember = await User.findOne({ email: req.body.email })
        team.members.addToSet({ _id: newMember._id})
        await team.save()
        // create role for new member
        const newMemberRole = await TeamRole.create({ role: req.body.role, team: team._id})
        // add role to new member's team array
        newMember.teams.addToSet({ _id: newMemberRole._id })
        await newMember.save()
        res.json({ team, newMemberRole, newMember })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

exports.updateTeam = async (req, res) => {
    try {
        const updates = Object.keys(req.body)
        const team = await Team.findOne({ _id: req.params.id })
        updates.forEach(update => team[update] = req.body[update])
        await team.save()
        res.json(team)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}
