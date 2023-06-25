const mongoose = require('mongoose')

const teamRoleSchema = new mongoose.Schema({
    role: { type: String, required: true },
    team: { type: mongoose.Types.ObjectId, ref: 'Team' }
})

const TeamRole = mongoose.model('TeamRole', teamRoleSchema)

module.exports = TeamRole