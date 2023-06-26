const mongoose = require('mongoose')

const teamSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    members: {
        admin: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
        contributor: [{ type: mongoose.Types.ObjectId, ref: 'User' }]
    },
    projects: [{ type: mongoose.Types.ObjectId, ref: 'Project' }]
}, {
    timestamps: true
})

teamSchema.methods.getUserRole = async function(user) {
    if (this.members.admin.includes(user._id)) return 'admin'
    if (this.members.contributor.includes(user._id)) return 'contributor'
}

const Team = mongoose.model('Team', teamSchema)

module.exports = Team