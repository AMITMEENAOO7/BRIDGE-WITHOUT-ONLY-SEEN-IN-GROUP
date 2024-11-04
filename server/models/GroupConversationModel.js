const mongoose = require('mongoose')

// Group message schema
const groupMessageSchema = new mongoose.Schema({
    groupId: { // Refers to the GroupConversation ID
        type: mongoose.Schema.ObjectId,
        ref: 'GroupConversation',
        required: true
    },
    sender: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    senderName: {
        type: String,
        ref: 'User',
    },
    text: {
        type: String,
        default: ""
    },
    translatedText: [ // New field for translated text
        {
            receiver_id: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true
            },
            languageCode: {
                type: String,
                required: true
            },
            text: {
                type: String,
                required: true
            }
        }
    ],
    ind_status: [{ // Updated structure for status
        receiver_id: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true
        },
        status: {
            type: String,
            enum: ['sent', 'delivered', 'seen'], // Include all possible statuses
            default: "sent"
        },
        receiver_name: {
            type: String,
            ref: 'User',
        },
    }],
    status: {
        type: String,
        enum: ['sent', 'delivered', 'seen'], // Include all possible statuses
        default: "sent"
    },
}, {
    timestamps: true
});

// Group conversation schema
const groupConversationSchema = new mongoose.Schema({
    groupName: {
        type: String,
        required: true
    },
    admin: { // The user ID of the group admin
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [ // Updated to hold participant details
        {
            userId: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true
            },
            name: {
                type: String,
                required: true // Name is now required
            },
            language: {
                type: String,
                required: true // Language is now required
            }
        }
    ],
    messages: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'GroupMessage'
        }
    ],
    groupPhoto: [
        {
            type: String,
            default: ""
        }    
    ],
}, {
    timestamps: true
});

const GroupMessageModel = mongoose.model('GroupMessage', groupMessageSchema);
const GroupConversationModel = mongoose.model('GroupConversation', groupConversationSchema);

module.exports = {
    GroupMessageModel,
    GroupConversationModel
}