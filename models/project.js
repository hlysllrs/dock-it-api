const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    contributors: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    tasks: [{ type: mongoose.Types.ObjectId, ref: 'Task' }]
})

const Project = mongoose.model('Project', projectSchema)

module.exports = Project