import { configureStore } from '@reduxjs/toolkit'
import userReducer from './userSlice'
import chatSlicer from  './chatSlice'


export const store = configureStore({
  reducer: {
        user : userReducer,
        chat : chatSlicer
  },
})