const { GroupConversationModel } = require("../models/GroupConversationModel");
const { GroupMessageModel } = require("../models/GroupConversationModel");

const getGroupConversation = async (currentUserId) => {
    if (currentUserId) {
        // Fetch group conversations where the user is a participant
        const groupConversations = await GroupConversationModel.find({
            participants: { $elemMatch: { userId: currentUserId } }
        })
        .sort({ updatedAt: -1 })
        .populate('admin') // Populate admin details to get full user info
        .populate('participants'); // Populate participants details to get full user info

        const conversationsWithMessages = await Promise.all(groupConversations.map(async (group) => {
            // Fetch messages for each group conversation
            const messages = await GroupMessageModel.find({ groupId: group._id })
                .sort({ createdAt: -1 })
                .populate('sender'); // Populate sender details

            const countUnseenMsg = messages.reduce((prev, curr) => {
                return prev + (curr.seen ? 0 : 1);
            }, 0);

            // Get the last message and its sender
            const lastMsg = messages[0] || null; // Get the last message or null if no messages
            const lastMsgSender = lastMsg ? lastMsg.sender : null; // Get the sender of the last message

            return {
                _id: group._id,
                groupName: group.groupName, // Include groupName directly
                admin: group.admin,
                groupPhoto: group.groupPhoto, // Admin details populated with full user info
                participants: group.participants, // Participants details populated with full user info
                unseenMsg: countUnseenMsg,
                lastMsg: {
                    ...lastMsg,
                    sender: lastMsgSender // Include the sender of the last message
                },
                messages: messages // Include all messages with sender information
            };
        }));

        return conversationsWithMessages;
    } else {
        return [];
    }
};

module.exports = getGroupConversation;