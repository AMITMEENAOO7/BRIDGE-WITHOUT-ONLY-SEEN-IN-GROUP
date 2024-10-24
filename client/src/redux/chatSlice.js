import { createSlice } from '@reduxjs/toolkit';

const initialChatState = {
    activeChatId: null,
    chats: {},
    messages: {}
};

const chatSlice = createSlice({
    name: 'chat',
    initialState: initialChatState,
    reducers: {
        setActiveChat: (state, action) => {
            state.activeChatId = action.payload;
        },
        receiveMessage: (state, action) => {
            const { chatId, message } = action.payload;
            if (!state.messages[chatId]) {
                state.messages[chatId] = [];
            }
            state.messages[chatId].push(message);
        },
        addChat: (state, action) => {
            const { chatId, chatInfo } = action.payload;
            state.chats[chatId] = chatInfo;
        }
    }
});

// Action creators
export const { setActiveChat, receiveMessage, addChat } = chatSlice.actions;

export default chatSlice.reducer;
