import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Define an asynchronous thunk to fetch the current user
export const fetchCurrentUser = createAsyncThunk(
    'user/fetchCurrentUser',
    async () => {
        const URL = `${process.env.REACT_APP_BACKEND_URL}/api/user-details`;
        const response = await axios({
            url: URL,
            withCredentials: true // Include credentials for the request
        });
        return response.data; // Assuming the response contains the user data
    }
);

const initialState = {
    _id: '',
    name: '',
    email: '',
    profile_pic: '',
    language: '',
    token: '',
    onlineUser: [],
    socketConnection: null,
    status: 'idle', // For tracking loading state
    error: null,
    groups:[] // For tracking error state
};

// Create the user slice
export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state._id = action.payload._id;
            state.name = action.payload.name;
            state.email = action.payload.email;
            state.language = action.payload.language;
            state.profile_pic = action.payload.profile_pic;
        },
        setToken: (state, action) => {
            state.token = action.payload;
        },
        logout: (state) => {
            state._id = '';
            state.name = '';
            state.email = '';
            state.language = '';
            state.profile_pic = '';
            state.token = '';
            state.socketConnection = null;
        },
        setOnlineUser: (state, action) => {
            state.onlineUser = action.payload;
        },
        setSocketConnection: (state, action) => {
            state.socketConnection = action.payload;
        },
        setGroups: (state, action) => {
            state.groups = action.payload; // Set groups in the state
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCurrentUser.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCurrentUser.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // Set the user data in state
                state._id = action.payload._id;
                state.name = action.payload.name;
                state.email = action.payload.email;
                state.language = action.payload.language;
                state.profile_pic = action.payload.profile_pic;
            })
            .addCase(fetchCurrentUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message; // Capture the error message
            });
    },
});

// Action creators are generated for each case reducer function
export const { setUser, setToken, logout, setOnlineUser, setSocketConnection, setGroups } = userSlice.actions;

// Selector to get the current user ID
export const selectCurrentUserId = (state) => state.user._id;

export default userSlice.reducer;