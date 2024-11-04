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
const{ GroupConversationModel, GroupMessageModel}=require('../models/GroupConversationModel')

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
    console.log("myId type:", typeof myId, "userId type:", typeof userId);
    
    try {
        // Find a conversation where either the sender is myId and the receiver is userId, or vice versa
        let conversation = await ConversationModel.findOne({
            $or: [
                { sender: myId, receiver: userId },
                { sender: userId, receiver: myId }
            ]
        });

        if (conversation) {
            // Send back the conversation ID (_id) as chatId
            return res.json({ conversationId: conversation._id });
        } else {
            // If no conversation is found, create a new one
            conversation = new ConversationModel({
                sender: myId,
                receiver: userId,
                messages: [] // Initialize with an empty messages array
            });

            await conversation.save(); // Save the new conversation to the database
            return res.json({ conversationId: conversation._id }); // Return the new conversation ID
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

// Endpoint to create a new group conversation
router.post('/create-group', async (req, res) => {
    const { groupName, adminId, participants, groupPhoto } = req.body;

    // Validate input
    if (!groupName || !adminId || !Array.isArray(participants) || participants.length === 0) {
        return res.status(400).json({ message: "Group name, admin ID, and participants are required." });
    }


    try {
        // Create a new group conversation
        const newGroupConversation = new GroupConversationModel({
            groupName,
            admin: adminId,
            participants,
            groupPhoto
        });

        // Save the group conversation to the database
        await newGroupConversation.save();

        res.status(201).json({ message: "Group conversation created successfully.", group: newGroupConversation });
    } catch (error) {
        console.error("Error creating group conversation:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get('/group/:groupId/details', async (req, res) => {
    const { groupId } = req.params;

    try {
        // Find the group conversation by ID and populate only required fields
        const groupDetails = await GroupConversationModel.findById(groupId)
            .select('groupName admin participants') // Select only the necessary fields
            .populate('admin', 'name') // Populate admin's name only
            .populate('participants', 'name'); // Populate participants' names only

        if (!groupDetails) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Send only relevant details
        res.json({
            groupName: groupDetails.groupName,
            admin: groupDetails.admin,
            participants: groupDetails.participants,
        });
    } catch (error) {
        console.error("Error fetching group details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// Endpoint to send a message to a group
router.post('/group/:groupId/message', async (req, res) => {
    //const { groupId } = req.params;
    const { groupId,senderId, text,translatedText } = req.body; // Expecting senderId and text in the request body

    if (!senderId || !text) {
        return res.status(400).json({ message: "Sender ID and text are required." });
    }

    try {
        // Create a new group message
        const newGroupMessage = new GroupMessageModel({
            groupId,
            sender: senderId,
            text,
            translatedText: translatedText // Initialize as empty or populate as needed
        });

        // Save the message to the database
        await newGroupMessage.save();

        // Optionally, you can also update the group conversation to include this message
        await GroupConversationModel.findByIdAndUpdate(groupId, {
            $push: { messages: newGroupMessage._id }
        });

        res.status(201).json({ message: "Message sent successfully.", message: newGroupMessage });
    } catch (error) {
        console.error("Error sending group message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Add this route to fetch user groups
router.get('/user-groups/:userId', async (req, res) => {
    try {
        const groups = await GroupConversationModel.find({ 'participants.userId': req.params.userId });
        res.json({ groups });
    } catch (error) {
        console.error("Error fetching groups:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Endpoint to get messages for a specific group
router.get('/group/:groupId/messages', async (req, res) => {
    const { groupId } = req.params; // Get the group ID from URL parameters

    try {
        // Fetch messages for the specified group
        const messages = await GroupMessageModel.find({ groupId }) // Find messages by groupId
            .populate('sender') // Populate sender details if needed
            .sort({ createdAt: -1 }); // Sort messages by creation date in descending order

        if (!messages.length) {
            return res.status(404).json({ message: "No messages found for this group." });
        }

        res.json(messages); // Return the messages
    } catch (error) {
        console.error("Error fetching group messages:", error); // Log the error
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router