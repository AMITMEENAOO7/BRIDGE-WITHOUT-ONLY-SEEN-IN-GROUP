const express = require('express')
const registerUser = require('../controller/registerUser')
const checkEmail = require('../controller/checkEmail')
const checkPassword = require('../controller/checkPassword')
const userDetails = require('../controller/userDetails')
const logout = require('../controller/logout')
const updateUserDetails = require('../controller/updateUserDetails')
const searchUser = require('../controller/searchUser')
const UserModel = require('../models/UserModel'); // Ensure this path is correct
const translateMessage = require('../utils/translateService'); // Import the translation function
const {ConversationModel} = require('../models/ConversationModel'); // Import the ConversationModel


const router = express.Router()

//create user api
router.post('/register',registerUser)
//check user email
router.post('/email',checkEmail)
//check user password
router.post('/password',checkPassword)
//login user details
router.get('/user-details',userDetails)
//logout user
router.get('/logout',logout)
//update user details
router.post('/update-user',updateUserDetails)
//search user
router.post("/search-user",searchUser)

// Endpoint to get user by ID
router.get('/users/:id', async (req, res) => {
    try {
        const user = await UserModel.findById(req.params.id).select('language'); // Select only the language field
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Translation endpoint
router.post('/translate', async (req, res) => {
    const { text, targetLang } = req.body; // Expecting text and targetLang in the request body
    try {
        const translatedText = await translateMessage(text, targetLang);
        res.json({ translatedText });
    } catch (error) {
        console.error("Translation error:", error);
        res.status(500).json({ message: "Translation failed" });
    }
});

// Endpoint to get conversations for a user
router.get('/conversations/:userId', async (req, res) => {
    try {
        const conversations = await ConversationModel.find({ 
            $or: [{ sender: req.params.userId }, { receiver: req.params.userId }] 
        }).populate('messages'); // Populate messages if needed
        res.json(conversations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
// Fetch the conversation ID based on two user IDs
router.get('/conversation/:myId/:userId', async (req, res) => {
    const { myId, userId } = req.params; // Get both user IDs from URL parameters
    console.log("myyyyyyserverId:", myId, "anoooootheruserId:", userId);
    
    try {
        // Find a conversation where either the sender is myId and the receiver is userId, or vice versa
        const conversation = await ConversationModel.findOne({
            $or: [
                { sender: myId, receiver: userId },
                { sender: userId, receiver: myId }
            ]
        });

        if (conversation) {
            // Send back the conversation ID (_id) as chatId
            res.json({ conversationId: conversation._id });
        } else {
            // If no conversation is found
            res.json({ message: "No conversation found" });
        }
    } catch (error) {
        console.error(error); // Log the error
        res.status(500).json({ message: "Internal server error" });
    }
});

// Endpoint to get messages for a specific conversation
router.get('/conversations/:conversationId/messages', async (req, res) => {
    try {
        const { conversationId } = req.params; // Get conversation ID from URL parameters
        const conversation = await ConversationModel.findById(conversationId).populate('messages'); // Populate messages
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        res.json(conversation.messages); // Return the messages
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router
