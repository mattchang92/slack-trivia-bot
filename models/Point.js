const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
  slackId: String,
  userId: mongoose.Schema.Types.ObjectId,
  seasonId: mongoose.Schema.Types.ObjectId,
});

module.exports = mongoose.model('points', PointSchema);