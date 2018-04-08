const mongoose = require('mongoose');

const SeasonSchema = new mongoose.Schema({
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  seasonName: String,
  nickname: String,
});

module.exports = mongoose.model('Season', SeasonSchema);