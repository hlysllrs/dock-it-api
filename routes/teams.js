const express = require('express')
const router = express.Router()
const teamCtrl = require('../controllers/teams')
const userCtrl = require('../controllers/users')

// create a team
router.post('/', userCtrl.auth, teamCtrl.createTeam)

// add member to a team
router.put('/add/:id', userCtrl.auth, teamCtrl.checkAdmin, teamCtrl.addTeamMember)

// // remove member from team
router.put('/remove/:id', userCtrl.auth, teamCtrl.checkAdmin, teamCtrl.removeTeamMember)

// update team info
router.put('/:id', userCtrl.auth, teamCtrl.checkAdmin, teamCtrl.updateTeam)

// delete team
router.delete('/:id', userCtrl.auth, teamCtrl.checkAdmin, teamCtrl.deleteTeam)

// show team details
router.get('/:id', userCtrl.auth, teamCtrl.showTeamDetails)

// show team projects
router.get('/:id/projects', userCtrl.auth, teamCtrl.showTeamProjects)

// show all user's teams
router.get('/', userCtrl.auth, teamCtrl.showAllTeams)

module.exports = router