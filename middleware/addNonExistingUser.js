const User = require('../models').User;
const titleize = require('../helpers').titleize;

module.exports = async (req, res, next) => {
  const user = await User.findOne({ slackId: req.body.user_id });
  if (!user) {
    new User({
      nickname: '',
      firstName: titleize(req.body.user_name.split('.')[0]),
      lastName: titleize(req.body.user_name.split('.')[1]),
      slackId: req.body.user_id,
    }).save();
  }
  next();
};