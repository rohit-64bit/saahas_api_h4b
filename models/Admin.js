const { Schema, model } = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new Schema({

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false // Exclude password from queries by default
    }

}, {
    timestamps: true
});

// Middleware to hash password before saving
AdminSchema.pre('save', async function (next) {

    if (this.isModified('password')) {

        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    next();

});

AdminSchema.methods.comparePassword = async function (candidatePassword) {

    const compare = await bcrypt.compare(candidatePassword, this.password);

    if (!compare) {
        throw new Error('Invalid password');
    }

    

}

module.exports = model('Admin', AdminSchema);