const mongoose = require('mongoose')

const teamSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    members: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    projects: [{ type: mongoose.Types.ObjectId, ref: 'Project' }]
}, {
    timestamps: true
})

const Team = mongoose.model('Team', teamSchema)

module.exports = Team