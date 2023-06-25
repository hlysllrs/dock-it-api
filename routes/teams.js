const express = require('express')
const router = express.Router()
const teamCtrl = require('../controllers/teams')
const userCtrl = require('../controllers/users')

// create a team
router.post('/', userCtrl.auth, teamCtrl.createTeam)

// add member to a team
router.post('/addmember/:id', userCtrl.auth, teamCtrl.checkRole, teamCtrl.addTeamMember)

// update team info
router.put('/:id', userCtrl.auth, teamCtrl.checkRole, teamCtrl.updateTeam)


module.exports = router