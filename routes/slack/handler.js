const moment = require('moment-timezone');
const mongoose = require('mongoose');

const models = require('../../models');
const content = require('../../content');
const config = require('../../config');

const adminIds = [process.env.RUBY_SLACK_ID];

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
    text: `${user.firstName} ${user.lastName}`,
    value: user._id,
  }));

  return content({ nameSelection }).awardPoint;
};

const sendPermissionDeniedTemplate = () => {
  const findRand = arr => arr[Math.floor(arr.length * Math.random())]; 
  const text = content().permissionDeniedText;
  const gifs = content().permissionDeniedGifs;

  return content({ text: findRand(text), gif: findRand(gifs) }).permissionDeniedTemplate;
}

const cancelPoint = async pointId => {
  await models.Point.remove({ _id: pointId });
  return { text: "Point has been revoked" };
}

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
}

const handleTopLevelNav = async (request, action) => {
  switch(action.name) {
    case 'score': {
      const seasons = await models.Season.find();
      const actions = seasons.map(season => ({
        name: season.seasonName,
        text: season.isActive ? "Current Season" : season.seasonName,
        type: 'button',
        value: season._id,
        style: season.isActive ? 'danger' : '',
      }));

      const response = content({ actions }).seasonSelect;

      return response;
    }
    case 'addQuestion':
      return { text: "Coming soon.." };
      return content().addQuestionInstructions;
    case 'viewCategories': {
      const currentSeason = await models.Season.findOne({ isActive: true });
      if (currentSeason) {
        const stringifiedCategories = formatCategoryResponse(currentSeason.categories);
        
        return { text: `Current daily categories are: \n${stringifiedCategories}\n\n Type *"/trivia update categories: (comma separated values)"* to update the weekly categories` };
      } else {
        return { text: 'No seasons currently active' };
      }
    }
    case 'help':
      return content().helpMenu;
    case 'minusMaz':
      return { text: "Thank you for choosing Mazen." };
    case 'minusShawn':
      return { text: "Down with the King!" }
  }
}


const handleInteractive = async (req) => {
  const request = JSON.parse(req.body.payload);
  const action = request.actions[0];
  switch(request.callback_id) {
    case 'topLevelNav': {
      return handleTopLevelNav(request, action);
    }
    case 'seasonSelect': {
      const _id = request.actions[0].value;
      const season = await models.Season.findOne({ _id });
      const scoreObj = (season.score && Object.keys(season.score).length) ?
        season.score : await buildScoreObject(_id);

      const stringifiedScore = formatScoreResponse(scoreObj);

      return { text: stringifiedScore };
    }
    case 'endSeason': {
      const decision = action.value;
      if (decision === 'yes') {
        const activeSeason = await models.Season.findOne({ isActive: true });
        if (activeSeason) {
          activeSeason.isActive = false;
          activeSeason.save();
          return { response_type: 'in_channel', text: `The ${activeSeason.seasonName} season has been ended by Ruby-Bot` };
        }
      } else {
        return { text: 'Cancelled' };
      }
    }
    case 'startNewSeason': {
      if (action.name === 'yes') {
        const activeSeason = await models.Season.findOne({ isActive: true });
        activeSeason.isActive = false;
        activeSeason.endDate = moment.tz(new Date, 'America/Vancouver').format();
        activeSeason.save();
        return startNewSeason(action.value);
      } else {
        return { text: 'Cancelled' };
      }
    }
    case 'awardPoint': {
      const activeSeason = await models.Season.findOne({ isActive: true });
      const user = await models.User.findOne({ _id: action.selected_options[0].value });
      const newPoint = new models.Point({
        userId: action.selected_options[0].value,
        seasonId: activeSeason._id
      });
      newPoint.save();
      const pointId = newPoint._id;

      return content({ 
        name: `${user.firstName} ${user.lastName}`,
        pointId,
      }).awardPointAndThen;
    }
    case 'awardPointAndThen': {
      if (action.name === 'anotherPoint') {
        return sendAwardPointTemplate();
      } else if (action.name === 'cancelPoint') {
        return cancelPoint(action.value);
      }
    }
  }
}

const startNewSeason = (name) => {
  const timestamp = moment.tz(new Date, 'America/Vancouver').format();
  models.Season.create({
    isActive: true,
    seasonName: name,
    startDate: timestamp,
    categories: {
      Monday: "",
      Tuesday: "",
      Wednesday: " ",
      Thursday: "",
      Friday: ""
    }
  });

  return { response_type: 'in_channel', text: `Ruby-Bot has started the ${name} season` };
}


const handleText = async (req) => {
  const command = req.body.text.split(':')[0].trim().toLowerCase();
  const userSlackId = req.body.user_id;
  
  switch(command) {
    case 'update categories': {
      const options = req.body.text.split(':')[1].trim().toLowerCase();
      const newCategories = options.split(',');

      if (newCategories.length !== 5) {
        return { text: 'Error updating categories, make sure you specify 5 categories (4 commas)' };
      } else {
        const updatedCategories = newCategories
          .reduce((acc, name, i) => Object.assign(acc, { [config.days[i]]: name }), {});
        const update = await models.Season.update({ isActive: true }, { $set: { categories: updatedCategories } });
        
        if (update.ok && update.nModified) {
          const stringifiedCategories = formatCategoryResponse(updatedCategories);
          return { text: `Categories updated. New categories are: \n${stringifiedCategories}` };
        }
      }
    }
    case 'new season': {
      if (!adminIds.includes(userSlackId)) return sendPermissionDeniedTemplate();
      const name = req.body.text.split(':')[1];
      if (!name) return { text: "New seasons need a name. Eg. *\"/trivia new season: Q2 2018\"*" };

      const activeSeason = await models.Season.findOne({ isActive: true });
      const confirmationResponse = content({ value: name.trim() }).newSeasonConfirmation;

      return activeSeason ? confirmationResponse : startNewSeason(name.trim());
    }
    case 'end season': {
      if (!adminIds.includes(userSlackId)) return sendPermissionDeniedTemplate();
      const activeSeason = await models.Season.findOne({ isActive: true });
      return activeSeason ? content().seasonEndConfirmation : { text: "No active seasons currently" }
    }
    case 'points': {
      if (!adminIds.includes(userSlackId)) return sendPermissionDeniedTemplate();
      return sendAwardPointTemplate();
    }
    case 'question': {
      return { text: "Coming soon..." };
      const input = req.body.split(':').slice(1).join('');
      const splitInput = input.split('@');
      if (splitInput.length === 1) {
        return { text: 'A time must be specified' };
      } else if (splitInput.length > 2) {
        return { text: 'Sorry but "@" is a reserved to specify the question delivery time' };
      } else {
        const question = splitInput[0].trim();
        const time = splitInput[1].trim();
      }
    }
    case 'help':
      return content().helpMenu;
    default: 
      return { text: "Sorry but NLP is beyond the scope of my programmer's abilities :cry: .. I only accept case *insensitive* exact matches for commands :sob:" };
  }
};


module.exports = {
  handleInteractiveCommand: (req, res, next) => {
    handleInteractive(req)
      .then(response => {
        res.status(200).json(response);
        next();
      })
      .catch(err => {
        res.status(404).send(err);
        next(err);
      });
  },
  handleTextCommand: (req, res, next) => {
    handleText(req)
      .then(response => {
        res.status(200).json(response);
        next();
      })
      .catch(err => {
        res.status(404).send(err);
        next(err);
      });
  }
}