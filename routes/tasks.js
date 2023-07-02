const express = require('express')
const router = express.Router()
const taskCtrl = require('../controllers/tasks')
const teamCtrl = require('../controllers/teams')
const userCtrl = require('../controllers/users')

// create a task
router.post('/', userCtrl.auth, taskCtrl.createTask)


module.exports = router