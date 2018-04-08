const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullname: String,
  slackId: String,
  nickname: String,
});

module.exports = mongoose.model('User', UserSchema);