const mongoose = require('mongoose')

const projectRoleSchema = new mongoose.Schema({
    role: { type: String, required: true },
    project: { type: mongoose.Types.ObjectId, ref: 'Project' }
})

const ProjectRole = mongoose.model('ProjectRole', projectRoleSchema)

module.exports = ProjectRole