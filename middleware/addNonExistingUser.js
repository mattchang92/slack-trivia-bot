const User = require('../models').User;
const titleize = require('../helpers').titleize;

module.exports = async (req, res, next) => {
  const user = await User.findOne({ slackId: req.body.user_id });
  if (!user && req.body.user_name) {
    const firstName = titleize(req.body.user_name.split('.')[0]);
    const lastName = req.body.user_name.includes('.') ? titleize(req.body.user_name.split('.')[1]) : '';

    new User({
      nickname: '',
      firstName,
      lastName,
      slackId: req.body.user_id,
    }).save();
  }
  next();
};