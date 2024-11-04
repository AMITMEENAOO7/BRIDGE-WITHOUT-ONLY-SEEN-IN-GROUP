const express = require('express')
const { Server } = require('socket.io')
const http = require('http')
const getUserDetailsFromToken = require('../helpers/getUserDetailsFromToken')
const UserModel = require('../models/UserModel')
const { ConversationModel,MessageModel } = require('../models/ConversationModel')
const getConversation = require('../helpers/getConversation')
const getGroupConversation = require('../helpers/getGroupConversation')
const app = express()

/***socket connection */
const server = http.createServer(app)
const io = new Server(server,{
    cors : {
        origin : process.env.FRONTEND_URL,
        credentials : true
    }
})

/***
 * socket running at http://localhost:8080/
 */

//online user
const onlineUser = new Set()

io.on('connection',async(socket)=>{
    // console.log("connect User ", socket.id)

    const token = socket.handshake.auth.token;

    //current user details 
    const user = await getUserDetailsFromToken(token)

    //create a room
    socket.join(user?._id?.toString())
    onlineUser.add(user?._id?.toString())

    io.emit('onlineUser',Array.from(onlineUser))

    //socket.emit('checkOfflineMessages', user._id);

    socket.on('message-page',async(userId)=>{
        // console.log('userId',userId)
        const userDetails = await UserModel.findById(userId).select("-password")
        
        const payload = {
            _id : userDetails?._id,
            name : userDetails?.name,
            email : userDetails?.email,
            profile_pic : userDetails?.profile_pic,
            online : onlineUser.has(userId)
        }
        socket.emit('message-user',payload)

        //get previous message
        let conversation = await ConversationModel.findOne({
            "$or" : [
                { sender : user?._id, receiver : userId },
                { sender : userId, receiver :  user?._id}
            ]
        })

        if (conversation) {
            // If conversation exists, emit previous messages
            const getConversationMessage = await ConversationModel.findById(conversation._id).populate('messages');
            socket.emit('previous messages', getConversationMessage?.messages || []);
            socket.emit('message-user', { ...payload, chatId: conversation._id }); // Include chatId in the payload
        } else {
            // If conversation does not exist, create a new one
            conversation = new ConversationModel({
                sender : user?._id,
                receiver : userId
            });
            await conversation.save(); // Save the new conversation

            // Emit an empty array for previous messages since it's a new conversation
            socket.emit('previous messages', []);
            socket.emit('message-user', { ...payload, chatId: conversation._id }); // Include chatId in the payload
        }
    })


    //new message
    socket.on('new message',async(data)=>{

        //check conversation is available both user

        let conversation = await ConversationModel.findOne({
            "$or" : [
                { sender : data?.sender, receiver : data?.receiver },
                { sender : data?.receiver, receiver :  data?.sender}
            ]
        })

        //if conversation is not available
        if(!conversation){
            conversation = new ConversationModel({
                sender : data?.sender,
                receiver : data?.receiver
            })
            await conversation.save()
        }
        
        const message = new MessageModel({
          chatId : conversation._id,
          sender : data?.sender,
          receiver : data?.receiver,  
          text : data.text,
          translatedText:data.translatedText,
          imageUrl : data.imageUrl,
          videoUrl : data.videoUrl,
          status:data.status,
          msgByUserId :  data?.msgByUserId,
        })
        const saveMessage = await message.save()

        // Update the conversation with the new message ID
        conversation.messages.push(saveMessage._id); // Add the new message ID to the messages array
        await conversation.save(); // Save the updated conversation
        console.log('Emitting message:', message);
        io.to(data?.sender).emit('message', message);
        io.to(data?.receiver).emit('message', message);

    // Optionally, emit the updated conversation if needed
        const conversationSender = await getConversation(data?.sender);
        const conversationReceiver = await getConversation(data?.receiver);
    
        //io.to(data?.sender).emit('conversation', conversationSender);
        io.to(data?.receiver).emit('conversation', conversationReceiver);
    
    })


    //sidebar
    socket.on('sidebar',async(currentUserId)=>{
        // console.log("current user",currentUserId)

        const conversation = await getConversation(currentUserId)

        socket.emit('conversation',conversation)
        
    })

    socket.on('groupsidebar',async(currentUserId)=>{
        // console.log("current user",currentUserId)

        const conversation = await getGroupConversation(currentUserId)

        socket.emit('groupConversations',conversation)
        
    })

    socket.on('seen',async(msgByUserId)=>{
        
        let conversation = await ConversationModel.findOne({
            "$or" : [
                { sender : user?._id, receiver : msgByUserId },
                { sender : msgByUserId, receiver :  user?._id}
            ]
        })

        const conversationMessageId = conversation?.messages || []

        const updateMessages  = await MessageModel.updateMany(
            { _id : { "$in" : conversationMessageId }, msgByUserId : msgByUserId },
            { "$set" : { seen : true }}
        )

        //send conversation
        const conversationSender = await getConversation(user?._id?.toString())
        const conversationReceiver = await getConversation(msgByUserId)

        io.to(user?._id?.toString()).emit('conversation',conversationSender)
        io.to(msgByUserId).emit('conversation',conversationReceiver)

        // Emit an event to update unseen message count
        io.emit('updateUnseenMessageCount', { userId: msgByUserId, unseenCount: conversationReceiver.unseenMsg });
    })

    //disconnect
    socket.on('disconnect',()=>{
        onlineUser.delete(user?._id?.toString())
        //console.log('disconnect user ',socket.id)
        io.emit('onlineUser', Array.from(onlineUser));
    })
    const { GroupMessageModel, GroupConversationModel } = require('../models/GroupConversationModel'); // Import both models


    // ... existing code ...

        // New event listener for getting group details
    socket.on('getGroupDetails', async (groupId) => {
            try {
                const groupConversation = await GroupConversationModel.findById(groupId).populate('messages');
                if (groupConversation) {
                    socket.emit('groupDetails', groupConversation);
                } else {
                    socket.emit('groupDetails', { error: 'Group not found' });
                }
            } catch (error) {
                console.error('Error fetching group details:', error);
                socket.emit('groupDetails', { error: 'Error fetching group details' });
            }
    });

    // New message for groups
    socket.on('new group message', async (data) => {
        // Create a new group message
        const groupMessage = new GroupMessageModel({
            groupId: data.groupId,
            sender: data.sender,
            senderName: data.senderName,
            text: data.text,
            translatedText: data.translatedText, // Include translated text if available
            ind_status: data.ind_status, // Use the individual status from the message
            status: data.status // Use the overall status from the message
        });

        // Save the new group message
        const savedMessage = await groupMessage.save();

        // Update the group conversation with the new message ID
        const groupConversation = await GroupConversationModel.findById(data.groupId);
        if (groupConversation) {
            groupConversation.messages.push(savedMessage._id); // Add the new message ID to the messages array
            await groupConversation.save(); // Save the updated group conversation
        }

        // Emit the new message to each participant individually
        for (const participant of groupConversation.participants) {
            io.to(participant.userId.toString()).emit('newGroupMessage', {
                ...savedMessage.toObject(),
                groupId: data.groupId,
            });

            // Emit the updated group conversation to each participant
            const updatedGroupConversation = await getGroupConversation(participant.userId.toString());
            io.to(participant.userId.toString()).emit('groupConversations', updatedGroupConversation);
        }

        console.log('New group message emitted to participants:', savedMessage);
    });

    // ... existing code ...

    // ... existing code ...

// New event listener for resetting unseen messages
    socket.on('resetUnseenMessages', async (groupId) => {
     try {
        const groupConversation = await GroupConversationModel.findById(groupId);
        if (groupConversation) {
            groupConversation.unseenMsg = 0; // Reset unseen messages count
            await groupConversation.save(); // Save the updated group conversation
            socket.emit('unseenMessagesReset', groupId); // Optionally emit a confirmation
        }
     } catch (error) {
        console.error('Error resetting unseen messages:', error);
     }
    });
    
    
    
   // Inside the io.on('connection', async (socket) => { ... })

// New event listener for fetching messages based on chatId
    socket.on('fetchMessages', async ({ chatId }) => {
     try {
        // Find the conversation by chatId and populate the messages
        const conversation = await ConversationModel.findById(chatId).populate({
            path: 'messages',
            populate: { path: 'sender' } // Populate sender details if needed
        });

        if (!conversation) {
            socket.emit('previousMessages', []); // Emit an empty array if no conversation found
            return;
        }

        // Emit the populated messages back to the client
        socket.emit('previousMessages', conversation.messages);
     } catch (error) {
        console.error('Error fetching messages:', error);
        socket.emit('previousMessages', []); // Emit an empty array on error
     }
    });

    // New event listener for marking a message as seen
    socket.on('messageSeen', async (messageId) => {
        try {
            // Update the message status to 'seen' in the database
            const updatedMessage = await MessageModel.findByIdAndUpdate(
                messageId,
                { $set: { status: 'seen' } },
                { new: true } // Return the updated document
            );

            if (updatedMessage) {
                // Emit the updated message status to the sender
                io.to(updatedMessage.sender.toString()).emit('messageStatusUpdated', {
                    messageId: updatedMessage._id,
                    status: 'seen'
                });

                // Optionally, you can also emit to the receiver if needed
                io.to(updatedMessage.receiver.toString()).emit('messageStatusUpdated', {
                    messageId: updatedMessage._id,
                    status: 'seen'
                });

                console.log(`Message ${messageId} marked as seen.`);

                // After updating the message status, emit the unseen message count
                        //send conversation
                const conversationSender = await getConversation(updatedMessage.sender.toString())
                const conversationReceiver = await getConversation(updatedMessage.receiver)
        
                //io.to(updatedMessage.sender.toString()).emit('conversation',conversationSender)
                io.to(updatedMessage.receiver.toString()).emit('conversation',conversationReceiver)
            } else {
                console.error(`Message ${messageId} not found.`);
            }
        } catch (error) {
            console.error('Error marking message as seen:', error);
        }
    });

    // New event listener for checking and updating messages when a user comes online
    socket.on('checkOfflineMessages', async (userId) => {
        if (!userId || userId.trim() === "") {
            console.error('Invalid userId:', userId);
            return; // Exit if userId is invalid
        }

        try {
            // Find messages sent to the user that are still marked as 'sent'
            const messages = await MessageModel.find({
                receiver: userId,
                status: 'sent'
            });

            // Update the status of those messages to 'delivered'
            for (const message of messages) {
                const updatedMessage = await MessageModel.findByIdAndUpdate(
                    message._id,
                    { $set: { status: 'delivered' } },
                    { new: true } // Return the updated document
                );

                if (updatedMessage) {
                    // Emit the updated message status to the sender
                    io.to(updatedMessage.sender.toString()).emit('messageStatusUpdated', {
                        messageId: updatedMessage._id,
                        status: 'delivered'
                    });

                    // Emit the updated message status to the receiver
                    io.to(updatedMessage.receiver.toString()).emit('messageStatusUpdated', {
                        messageId: updatedMessage._id,
                        status: 'delivered'
                    });

                    console.log(`Message ${updatedMessage._id} marked as delivered.`);
                }
            }
        } catch (error) {
            console.error('Error checking and updating offline messages:', error);
        }
    });

    // New event listener for checking and updating individual group messages when a user comes online
    socket.on('checkOfflineIndividualGroupMessages', async (userId) => {
        try {
            // Check if userId is valid before proceeding
            console.log('offlinecheck delivered',userId)
            if (!userId || typeof userId !== 'string' || userId.trim() === '') {
                console.error('Invalid userId:', userId);
                return; // Exit if userId is invalid
            }

            // Find all group conversations for the user
            const groupConversations = await GroupConversationModel.find({
                participants: { $elemMatch: { userId: userId } }
            });
            
            // Iterate through each group conversation
            for (const group of groupConversations) {
                // Find messages sent to the user in this group that are still marked as 'sent'
                const messages = await GroupMessageModel.find({
                    groupId: group._id,
                    'ind_status.receiver_id': userId,
                    'ind_status.status': 'sent'
                });

                console.log('sent messages',messages)

                // Update the status of those messages to 'delivered'
                for (const message of messages) {
                    // Update the individual status for the user
                    const indStatus = message.ind_status.find(status => status.receiver_id.toString() === userId);
                    if (indStatus) {
                        indStatus.status = 'delivered'; // Update individual status to delivered
                    }

                    // Check if all individual statuses are delivered
                    const allDeliveredOrSeen = message.ind_status
                      .filter(status => status.receiver_id.toString() !== message.sender.toString()) // Exclude sender
                      .every(status => status.status === 'delivered' || status.status === 'seen');

                    if (allDeliveredOrSeen) {
                    message.status = 'delivered'; // Update overall status
                    }


                    await message.save(); // Save the updated message

                    // Emit the updated message status to each receiver in the group
                    for (const participant of message.ind_status) {
                        io.to(participant.receiver_id.toString()).emit('messageStatusUpdated', {
                            messageId: message._id,
                            receiver_id: participant.receiver_id,
                            ind_status: message.ind_status,
                            status: message.status
                        });
                    }

                    // Emit the updated group conversation to each participant
                    const updatedGroupConversation = await getGroupConversation(userId);
                    for (const participant of message.ind_status) {
                        io.to(participant.receiver_id.toString()).emit('groupConversations', updatedGroupConversation);
                    }

                    console.log(`Message ${message._id} marked as delivered for user ${userId}.`);
                }
            }
        } catch (error) {
            console.error('Error checking and updating individual group messages:', error);
        }
    });

    // New event listener for marking a group message as seen
    socket.on('groupMessageIndividualSeen', async (data) => {
        const { messageId, userId } = data; // Extract messageId and userId from the data

        try {
            // Find the message by ID
            const message = await GroupMessageModel.findById(messageId);
            if (!message) {
                console.error(`Message ${messageId} not found.`);
                return;
            }

            // Update the individual status for the user
            const indStatus = message.ind_status.find(status => status.receiver_id.toString() === userId);
            if (indStatus) {
                indStatus.status = 'seen'; // Update individual status to seen
            }

            // Check if all individual statuses (excluding the sender) are seen
            const allSeen = message.ind_status
                .filter(status => status.receiver_id.toString() !== message.sender.toString()) // Exclude sender
                .every(status => status.status === 'seen');

            if (allSeen) {
                message.status = 'seen';
                console.log("STATUS for ",message._id,'is seen') // Update overall status
            }

            await message.save(); // Save the updated message

            // Emit the updated message status to each receiver in the group
            for (const participant of message.ind_status) {
                io.to(participant.receiver_id.toString()).emit('messageStatusUpdated', {
                    messageId: message._id,
                    receiver_id: participant.receiver_id,
                    ind_status: message.ind_status,
                    status: message.status

                });
            }

            // Emit the updated group conversation to all participants
            const updatedGroupConversation = await getGroupConversation(message.groupId); // Assuming message.groupId exists
            for (const participant of message.ind_status) {
                io.to(participant.receiver_id.toString()).emit('groupConversations', updatedGroupConversation);
            }

            console.log(`Message ${messageId} marked as seen for user ${userId}.`);
        } catch (error) {
            console.error('Error marking group message as seen:', error);
        }
    });

})

module.exports = {
    app,
    server
}
