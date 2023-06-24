const User = require('../models/user')
const TeamRole = require('../models/teamRole')
const Team = require('../models/team')

exports.checkRole = async (req, res, next) => {
    // find user
    // find teamRole of user
    
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

exports.addTeamMember = async (req, res) => {
    try {
        // find team by id in url
        const team = Team.findOne({ _id: req.params.id })
        // find user by email
        const newMember = User.findOne({ email: req.body.email })
        team.members.addToSet({ _id: newMember._id})
        team.save()
        res.json(team)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

