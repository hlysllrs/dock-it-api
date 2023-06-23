const express = require('express')
const router = express.Router()
const userController = require('../controllers/users')

// Index
router.get('/', userController.showAllUsers) // don't think this is necessary

// Delete
router.delete('/:id', userController.auth, userController.deleteUser)

// Update
router.put('/:id', userController.auth, userController.updateUser)

// Create 
router.post('/', userController.createUser)

// Show
router.get('/:id', userController.showUser)

// Login
router.post('/login', userController.loginUser)

// Logout
router.post('/logout', userController.auth, userController.logoutUser)

module.exports = router