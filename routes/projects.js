const express = require('express')
const router = express.Router()
const projectCtrl = require('../controllers/projects')
const teamCtrl = require('../controllers/teams') // DO I NEED THIS ONE HERE? 
const userCtrl = require('../controllers/users')

// create a project
router.post('/', userCtrl.auth, projectCtrl.createProject)

// add member to a project
router.put('/add/:id', userCtrl.auth, projectCtrl.checkAdmin, projectCtrl.addProjectMember)

// // remove member from project
router.put('/remove/:id', userCtrl.auth, projectCtrl.checkAdmin, projectCtrl.removeProjectMember)

// update project info
router.put('/:id', userCtrl.auth, projectCtrl.checkAdmin, projectCtrl.updateProject)

// delete project
router.delete('/:id', userCtrl.auth, projectCtrl.checkAdmin, projectCtrl.deleteProject)

module.exports = router