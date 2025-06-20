const { Schema, model } = require('mongoose')


const chatHistorySchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    messages: [
        {
            role: {
                type: String,
                enum: ['user', 'system'],
                required: true
            },
            content: {
                type: String,
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, { timestamps: true })


module.exports = model('ChatHistory', chatHistorySchema)