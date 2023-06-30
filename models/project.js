const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    type: { 
        type: String, 
        default: function() {
        if (!this.team) return 'personal'
        }
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    team: { type: mongoose.Types.ObjectId, ref: 'Team' },
    members: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    tasks: [{ type: mongoose.Types.ObjectId, ref: 'Task' }]
}, {
    timestmps: true
})

const Project = mongoose.model('Project', projectSchema)

module.exports = Project