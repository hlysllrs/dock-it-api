const User = require('../models/user')
const TeamRole = require('../models/teamRole')
const Team = require('../models/team')

// check team role of user making the request
exports.checkRole = async (req, res, next) => {
    try {
        // find user making the request
        const user = await User.findOne({ _id: req.user._id })
        // find requested team
        const team = await Team.findOne({ _id: req.params.id })
        // check if user is admin or contributor of team, and assign to req.user.role
        if (team.members.admin.includes(req.user._id)) req.user.role = 'admin'
        if (team.members.contributor.includes(req.user._id)) req.user.role = 'contributor'
        next()
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

exports.createTeam = async (req, res) => {
    try {
        // create team
        const team = await Team.create(req.body) // will receive title and description
        // add team to user's teams array
        req.user.teams.addToSet({ _id: team._id })
        await req.user.save()
        // add user to team's admin members array
        team.members.admin.addToSet({ _id: req.user._id })
        await team.save()
        res.json({ team, user: req.user})
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}
// add new team member by sending post request containing new member's email and role on the team. { email: '[INSERT EMAIL]', role: '[INSERT ROLE NAME]' }
exports.addTeamMember = async (req, res) => {
    try {
        // check if user making the request has authority to add members
        if(req.user.role !== 'admin') {
            throw new Error('user not authorized')
        }
        // find new member by email
        const newMember = await User.findOne({ email: req.body.email })
        // find team by id in req.params
        const team = await Team.findOne({ _id: req.params.id })
        // add member to team in designated role array
        team.members[req.body.role].addToSet({ _id: newMember._id})
        await team.save()
        // add team to new member's team array
        newMember.teams.addToSet({ _id: team._id })
        await newMember.save()
        res.json({ team, newMember })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

exports.updateTeam = async (req, res) => {
    try {
        // check if user making the request has authority to add members
        if(req.user.role !== 'admin') {
            throw new Error('user not authorized')
        }
        // make requested updates to team information
        const updates = Object.keys(req.body)
        const team = await Team.findOne({ _id: req.params.id })
        updates.forEach(update => team[update] = req.body[update])
        await team.save()
        res.json(team)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}
