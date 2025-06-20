const { Schema, model } = require('mongoose')

const AllySchema = new Schema({

    isApproved: {
        type: Boolean,
        default: false // Indicates if this is approved by the ally
    },
    for: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ally: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }

}, { timestamps: true })

module.exports = model('Ally', AllySchema)