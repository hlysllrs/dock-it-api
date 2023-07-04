const express = require('express')
const router = express.Router({ mergeParams: true })
const taskCtrl = require('../controllers/tasks')
const teamCtrl = require('../controllers/teams')
const userCtrl = require('../controllers/users')

// create a task
router.post('/', userCtrl.auth, projectCtrl.checkAdmin, taskCtrl.checkAssignedMember, taskCtrl.createTask)

// reassign a task
router.put('/reassign/:taskId', userCtrl.auth, projectCtrl.checkAdmin, taskCtrl.checkAssignedMember, taskCtrl.reassignTask)

// update a task's status
router.put('/status/:taskId', userCtrl.auth, projectCtrl.checkMember, taskCtrl.updateTaskStatus)

// update a task's details
router.put('/:taskId', userCtrl.auth, projectCtrl.checkAdmin, taskCtrl.updateTask)

// delete a task
router.delete('/:taskId', userCtrl.auth, projectCtrl.checkAdmin, taskCtrl.deleteTask)


module.exports = router