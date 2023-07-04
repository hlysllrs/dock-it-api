const express = require('express')
const router = express.Router()
const taskRoutes = require('./tasks')

const projectCtrl = require('../controllers/projects')
const teamCtrl = require('../controllers/teams') // DO I NEED THIS ONE HERE? 
const userCtrl = require('../controllers/users')

// create a project
router.post('/', userCtrl.auth, projectCtrl.createProject)

// add member to a project
router.put('/add/:projectId', userCtrl.auth, projectCtrl.checkAdmin, projectCtrl.addProjectMember)

// // remove member from project
router.put('/remove/:projectId', userCtrl.auth, projectCtrl.checkAdmin, projectCtrl.removeProjectMember)

// update project info
router.put('/:projectId', userCtrl.auth, projectCtrl.checkAdmin, projectCtrl.updateProject)

// delete project
router.delete('/:projectId', userCtrl.auth, projectCtrl.checkAdmin, projectCtrl.deleteProject)

// show a project
router.get('/:projectId', userCtrl.auth, projectCtrl.showProject)

// show all personal projects
router.get('/', userCtrl.auth, projectCtrl.showPersonalProjects)

// make tasks router a child router of project router
router.use('/:projectId/tasks', taskRoutes)

module.exports = router