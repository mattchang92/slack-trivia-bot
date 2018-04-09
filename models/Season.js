const mongoose = require('mongoose');

const SeasonSchema = new mongoose.Schema({
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  seasonName: String,
  score: {},
  categories: {
    Monday: String,
    Tuesday: String,
    Wednesday: String,
    Thursday: String,
    Friday: String,
  },
});

module.exports = mongoose.model('seasons', SeasonSchema);