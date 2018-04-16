const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  deliveryTime: Date,
  content: String,
  answer: String,
  seasonId: String,
});

module.exports = mongoose.model('questions', QuestionSchema);