const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  slackId: String,
  nickname: String,
});

module.exports = mongoose.model('users', UserSchema);