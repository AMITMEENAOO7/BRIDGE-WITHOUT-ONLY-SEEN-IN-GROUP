const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "provide name"]
  },
  email: {
    type: String,
    required: [true, "provide email"],
    unique: true
  },
  password: {
    type: String,
    required: [true, "provide password"]
  },
  profile_pic: {
    type: String,
    default: ""
  },
  language: { // Language field accepting any string
    type: String,
    required: [true, "provide language"],
    default: 'en-US' // Optional: you can set a default language if needed
  }
}, {
  timestamps: true
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
