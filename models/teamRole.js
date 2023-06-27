const mongoose = require('mongoose')

const teamRoleSchema = new mongoose.Schema({
    user: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true },
    team: { type: mongoose.Types.ObjectId, ref: 'Team', required: true }
})

const TeamRole = mongoose.model('TeamRole', teamRoleSchema)

module.exports = TeamRole