const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    dueDate: Date,
    project: { type: mongoose.Types.ObjectId, ref: 'Project' },
    assignedTo: { type: mongoose.Types.ObjectId, ref: 'User' },
    status: String
})

const Task = mongoose.model('Task', taskSchema)

module.exports = Task