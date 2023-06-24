const express = require('express')
const router = express.Router()
const teamController = require('../controllers/teams')
const userController = require('../controllers/users')

// create a team
router.post('/', userController.auth, teamController.createTeam)



module.exports = router