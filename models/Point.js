const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
  slackId: String,
  userId: Schema.Types.ObjectId,
  seasonId: Schema.Types.ObjectId,
});

module.exports = mongoose.model('Point', PointSchema);