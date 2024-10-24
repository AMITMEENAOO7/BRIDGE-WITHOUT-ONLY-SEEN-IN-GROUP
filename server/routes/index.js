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
const {MessageModel, ConversationModel} = require('../models/ConversationModel'); // Import both models


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
router.get('/conversations/:chatId/messages', async (req, res) => {
    try {
        const { chatId } = req.body; 
        
        const messages = await MessageModel.find({ chatId }) // Fetch messages based on chatId
            .populate('sender') // Populate sender details if needed
            .populate('receiver'); // Populate receiver details if needed
        res.json(messages); // Return the messages
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Endpoint to get messages for a specific conversation using both user IDs
router.get('/conversations/messages/:myId/:userId', async (req, res) => {
    const { myId, userId } = req.params; // Get both user IDs from URL parameters

    
    try {
        // Fetch messages where either user is the sender or receiver
        const messages = await MessageModel.find({
            $or: [
                { sender: myId, receiver: userId },
                { sender: userId, receiver: myId }
            ]
        })
        .populate('sender') // Populate sender details if needed
        .populate('receiver'); // Populate receiver details if needed

        if (!messages.length) {
            return res.status(404).json({ message: "No messages found" });
        }

        res.json(messages); // Return the messages
         
    } catch (error) {
        console.error("Error fetching messages:", error); // Log the error
        res.status(500).json({ message: "Internal server error" });
    }
});

// Endpoint to update message status

// ... existing code ...

// Endpoint to update message status
router.patch('/messages/update-status', async (req, res) => {
    const { messageId, status } = req.body;

    console.log('statussss is :', status,messageId)
     

    try {
      
      const message = await MessageModel.findById(messageId);
      
      if (!message) return res.status(404).json({ error:  'i dont know' });
  
      
      message.status = status; 
      await message.save();
      
  
      res.status(200).json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to update message status" });
    }
  });

// ... existing code ...


module.exports = router
