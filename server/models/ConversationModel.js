const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    chatId:{
        type : mongoose.Schema.ObjectId
        
    },
    sender : {
        type : mongoose.Schema.ObjectId,
        ref : 'User'
    },
    text : {
        type : String,
        default : ""
    },
    receiver :{
        type : mongoose.Schema.ObjectId,
        ref : 'User'
    },
    translatedText: { // New field for translated text
        type: String,
        default: ""
    },
    imageUrl : {
        type : String,
        default : ""
    },
    videoUrl : {
        type : String,
        default : ""
    },
    status : {
        type : String,
        enum: ['sent', 'delivered', 'seen'],
        default : "sent"
    },
    msgByUserId : {
        type : mongoose.Schema.ObjectId,
        required : true,
        ref : 'User'
    },
},{
    timestamps : true
})

const conversationSchema = new mongoose.Schema({
    sender : {
        type : mongoose.Schema.ObjectId,
        required : true,
        ref : 'User'
    },
    receiver : {
        type : mongoose.Schema.ObjectId,
        required : true,
        ref : 'User'
    },
    messages : [
        {
            type : mongoose.Schema.ObjectId,
            ref : 'Message'
        }
    ]
},{
    timestamps : true
})

const MessageModel = mongoose.model('Message',messageSchema)
const ConversationModel = mongoose.model('Conversation',conversationSchema)

module.exports = {
    MessageModel,
    ConversationModel
}