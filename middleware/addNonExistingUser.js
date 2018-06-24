const User = require('../models').User;
const titleize = require('../helpers').titleize;

module.exports = async (req, res, next) => {
  const user = await User.findOne({ slackId: req.body.user_id });
  if (!user && req.body.user_name) {
    const names = req.body.user_name.split('.');
    const firstName = titleize(names[0]);
    const lastName = names.length >= 2 ? titleize(names[1]) : '';

    new User({
      nickname: '',
      firstName,
      lastName,
      slackId: req.body.user_id,
    }).save();
  }
  next();
};