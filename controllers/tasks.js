const User = require('../models/user')
const Task = require('../models/task')
const Project = require('../models/project')

// create a new task
exports.createTask = async (req, res) => {
    try {
        // 🟥 CHECKING IF USER HAS AUTHORITY 🟥
        // check if personal project or team project
        // if team project, check if user is team admin
        // OR
        // check if user is project admin

        // create task
        const task = await Task.create(req.body)
        res.json(task)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// update task details - title, due date, etc.
exports.updateTask = async (req, res) => {
    try {
        // find task using req.params.id
        const task = await Task.findOne({ _id: req.params.id })
        // make requested updates to task information
        const updates = Object.keys(req.body)
        updates.forEach(update => task[update] = req.body[update])
        await task.save()
        res.json(task)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// delete task
exports.deleteTask = async (req, res) => {
    try {
        // find task using req.params.id
        const task = await Task.findOneAndDelete({ _id: req.params.id })
        res.json({ message: `${task.title} deleted` })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}