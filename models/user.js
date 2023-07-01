const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const secret = process.env.SECRET_KEY

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { 
        type: String, 
        required: true, 
        lowercase: true, 
        trim: true, 
        unique: true
        // 🟥 ADD EMAIL ADDRESS VALIDATION HERE 🟥 
    },
    password: { type: String, required: true, minLength: 8 }, // 🟥 ADD PASSWORD CHARACTER TYPE REQUIREMENTS??? 🟥 
    teams: [{ type: mongoose.Types.ObjectId, ref: 'TeamRole' }],
    projects: [{ type: mongoose.Types.ObjectId, ref: 'ProjectRole' }],
    tasks: [{ type: mongoose.Types.ObjectId, ref: 'Task' }], 
    isLoggedIn: { type: Boolean, default: false }
}, {
    timestamps: true,
    toJSON: { virtuals: true }
})

// combine first and last name to get full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`
})

userSchema.pre('save', async function(next) {
    if(this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8)
    }
    next()
})

userSchema.methods.generateAuthToken = async function() {
    const token = jwt.sign({ _id: this._id }, secret)
    return token
}

const User = mongoose.model('User', userSchema)

module.exports = User