const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    dueDate: Date,
    project: { type: mongoose.Types.ObjectId, ref: 'Project', required: true },
    assignedTo: { type: mongoose.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: [ 'Not Started', 'In Progress', 'Complete' ], default: 'Not Started' },
}, {
    timestamps: true
})

const Task = mongoose.model('Task', taskSchema)

module.exports = Task