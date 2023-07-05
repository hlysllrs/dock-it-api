const express = require('express')
const router = express.Router()
const userCtrl = require('../controllers/users')

/**
 * Route for deleting a user's account
 * - HTTP request type: DELETE
 * - endpoint: /users/:userId
 * - params:  
 *      -- :userId - _id of the user to be deleted
 * - callbacks:  
 *      -- userCtrl.auth - validates the user's token and checks if the user is logged in
 *      -- userctrl.deleteUser - deletes the user's account and all references to the user in associated documents
 */
router.delete('/:userId', userCtrl.auth, userCtrl.deleteUser)

/**
 * Route for updating a user's account innformation
 * - HTTP request type: PUT
 * - endpoint: /users/:userId
 * - params:  
 *      -- :userId - _id of the user to be updated
 * - callbacks:  
 *      -- userCtrl.auth - validates the user's token and checks if the user is logged in
 *      -- userctrl.updateUser - updates the user's information with data submitted in the request payload
 */
router.put('/:userId', userCtrl.auth, userCtrl.updateUser)

/**
 * Route for creating a user account
 * - HTTP request type: GET
 * - endpoint: /users/
 * - callbacks:  
 *      -- userctrl.createUser - creates a user account
 */
router.post('/', userCtrl.createUser)

/**
 * Route for showing a user's account innformation
 * - HTTP request type: GET
 * - endpoint: /users/:userId
 * - params:  
 *      -- :userId - _id of the user to be shown
 * - callbacks:  
 *      -- userCtrl.auth - validates the user's token and checks if the user is logged in
 *      -- userctrl.showUser - shows the given user's account details
 */
router.get('/:userId', userCtrl.auth, userCtrl.showUser)

/**
 * Route for logging a user in
 * - HTTP request type: POST
 * - endpoint: /users/login
 * - callbacks:  
 *      -- userctrl.loginUser - logs a user in using the email and password entered
 */
router.post('/login', userCtrl.loginUser)

/**
 * Route for logging a user out
 * - HTTP request type: POST
 * - endpoint: /users/logout
 * - callbacks:  
 *      -- userCtrl.auth - validates the user's token and checks if the user is logged in
 *      -- userctrl.logoutUser - logs a user out
 */
router.post('/logout', userCtrl.auth, userCtrl.logoutUser)

module.exports = router