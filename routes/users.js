const express = require('express')
const router = express.Router()
const userController = require('../controllers/users')

// Delete
router.delete('/:id', userController.auth, userController.deleteUser)

// Update
router.put('/:id', userController.auth, userController.updateUser)

// Create 
router.post('/', userController.createUser)

// Show
router.get('/:id', userController.auth, userController.showUser)

// Login
router.post('/login', userController.loginUser)

// Logout
router.post('/logout', userController.auth, userController.logoutUser)

module.exports = router