const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
  userId: String,
  seasonId: String,
});

module.exports = mongoose.model('points', PointSchema);