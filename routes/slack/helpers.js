const models = require('../../models');
const content = require('../../content');
const config = require('../../config');

const formatCategoryResponse = categories => {
  return Object.keys(categories)
    .filter(name => config.days.includes(name))
    .reduce((acc, name) => acc + `*${name}*: ${categories[name] || 'not yet set'}\n`, '');
};

const formatScoreResponse = score => {
  return Object.keys(score)
    .sort((user1, user2) => {
      if (score[user1] === score[user2]) return user1 < user2 ? -1 : 1;

      return score[user1] > score[user2] ? -1 : 1;
    })
    .reduce((acc, name, i) => acc + `${name}: ${score[name]} ${score[name] === 1 ? 'point' : 'points'} ${i === 0 ? ':trophy:' : ''} \n`, '');
};

const sendAwardPointTemplate = async () => {
  const users = await models.User.find().lean();
  const nameSelection = users.map(user => ({
    text: `${user.firstName} ${user.lastName || ''}`,
    value: user._id,
  }));

  return content({ nameSelection }).awardPoint;
};

const sendPermissionDeniedTemplate = () => {
  const findRand = arr => arr[Math.floor(arr.length * Math.random())]; 
  const text = content().permissionDeniedText;
  const gifs = content().permissionDeniedGifs;

  return content({ text: findRand(text), gif: findRand(gifs) }).permissionDeniedTemplate;
};

const cancelPoint = async pointId => {
  await models.Point.remove({ _id: pointId });
  return { text: "Point has been revoked" };
};

const buildScoreObject = async seasonId => {
  const users = await models.User.find().lean();
  const pointsAggregate = await models.Point.aggregate([
    { $match: { seasonId } },
    { $group: { _id: "$userId", points: { $sum: 1 } } }
  ]);

  return users.reduce((acc, user) => {
    const pointsObj = pointsAggregate.find(obj => obj._id === user._id.toString());
    const individualScore = pointsObj ? pointsObj.points : 0;
    const name = user.nickname || `${user.firstName} ${user.lastName[0]}`;

    return Object.assign(acc, { [name]: individualScore });
  }, {});
};

module.exports = {
  formatCategoryResponse,
  formatScoreResponse,
  sendAwardPointTemplate,
  sendPermissionDeniedTemplate,
  cancelPoint,
  buildScoreObject,
};
