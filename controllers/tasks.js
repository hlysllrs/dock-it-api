const User = require('../models/user')
const Task = require('../models/task')
const Project = require('../models/project')

/**
 * Checks if the user a task is being assigned to is a member of the given project
 * @method checkAssignedMember
 * @description used to check if the user a task is being assigned to is a member of the project specified by req.params.projectId before excecuting the next function in the route's callbacks
 * @throws throws an error if the assigned user is not a member of the project
 */
exports.checkAssignedMember = async (req, res, next) => {
    try {
        // find project using req.params.projectId
        const project = await Project.findOne({ _id: req.params.projectId })
        // check if user task is assigned to is a member of the project
        const userAssigned = await User.findOne({ _id: req.body.assignedTo })
        if(!project.members.includes(userAssigned._id)) {
            throw new Error(`${userAssigned.fullName} is not a member of the ${project.title} project and can not be assigned to this task`)
        }
        req.project = project
        req.userAssigned = userAssigned
        next()
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Create a new task
 * @method createTask
 * @description creates a new project
 * 
 * Request will contain: 
 *  - title: (required) title of the task  
 *  - dueDate: due date of the task    
 *      -- defaults to Date.now  
 *  - project: (required) ObjectId of the project the task is assigned to  
 *  - assignedTo: ObjectId of the user the task is assigned to  
 *      -- must be a member of the project  
 *  - status: current status of the task  
 *      -- defaults to 'Not started'  
 * 
 * Also adds task's _id to the assigned user's tasks array and to the assigned project's tasks array
 */
exports.createTask = async (req, res) => {
    try {
        // create task
        const task = await Task.create(req.body)
        // add task to assigned user's tasks array
        req.userAssigned.tasks.addToSet({ _id: task._id })
        await req.userAssigned.save()
        // add task to project's tasks array
        req.project.tasks.addToSet({ _id: task.project })
        await req.project.save()
        res.json({ task, project: req.project, user: req.userAssigned })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Update task details for the given task
 * @method updateTask
 * @description updates information of the task specified by req.params.taskId
 * 
 * Request may contain: 
 *  - title: title of the task
 *  - dueDate: due date of the task
 * 
 * For making changed to the task's status, please use the {@linkcode updateTaskStatus} method provided
 * For changing the user the task is assigned to, please use the {@linkcode reassignTask} method provided
 */
exports.updateTask = async (req, res) => {
    try {
        // find task using req.params.taskId
        const task = await Task.findOne({ _id: req.params.taskId })
        // make requested updates to task information
        const updates = Object.keys(req.body)
        updates.forEach(update => task[update] = req.body[update])
        await task.save()
        res.json(task)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Reassign the given task to a different user
 * @method reassignTask
 * @description updates the user assigned to the task specified by req.params.taskId
 * 
 * Request will contain: 
 *  - assignedTo: (required) ObjectId of the new user being assigned to the task  
 *      -- must be a member of the project
 */
exports.reassignTask = async (req, res) => {
    try {
        // find task using req.params.taskId
        const task = await Task.findOne({ _id: req.params.taskId })
        // find previous user task was assigned to 
        const prevAssigned = await User.findOne({ _id: task.assignedTo })
        // remove task from previously assigned user's tasks array
        prevAssigned.tasks.splice(prevAssigned.tasks.indexOf(task._id), 1)
        prevAssigned.save()
        // add task to newly assigned user's tasks array
        req.userAssigned.tasks.addToSet({ _id: task._id })
        req.userAssigned.save()
        // update task to be assigned to the new user
        task.assignedTo = newAssigned._id
        task.save()
        res.json({ task, prevAssigned, newAssigned })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Update the given task's status
 * @method updateTaskStatus
 * @description updates user assigned to the task specified by req.params.taskId
 * 
 * Request will contain:  
 *  - assignedTo: (required) ObjectId of the new user being assigned to the task  
 *      -- must be a member of the project
 */
exports.updateTaskStatus = async (req, res) => {
    try {
        // find task using req.params.taskId
        const task = await Task.findOne({ _id: req.params.taskId })
        if(task.assignedTo !== req.user._id) {
            throw new Error(`user not authorized to update status of ${task.title}`)
        }
        // update tasks's status
        task.status = req.body.status
        task.save()
        res.json(task)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

/**
 * Delete the given task
 * @method deleteTask
 * @description deletes the task specified by req.params.taskId
 * 
 * Also removes the task reference from any projects or users it was assigned to
 */
exports.deleteTask = async (req, res) => {
    try {
        // find task using req.params.taskId
        const task = await Task.findOneAndDelete({ _id: req.params.taskId })
        // remove task from assigned project's tasks array
        const project = await Project.findOne({ _id: req.params.projectId })
        project.tasks.splice(project.tasks.indexOf(task._id), 1)
        project.save()
        // remove task from assigned user's tasks array
        const userAssigned = await User.findOne({ _id: task.assignedTo })
        userAssigned.tasks.splice(userAssigned.tasks.indexOf(task._id), 1)
        userAssigned.save()
        res.json({ message: `${task.title} deleted` })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}