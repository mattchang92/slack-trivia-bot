const moment = require('moment-timezone');

const models = require('../../models');
const content = require('../../content');
const config = require('../../config');

const formatCategoryResponse = categories => {
  return Object.keys(categories)
    .filter(name => config.days.includes(name))
    .reduce((acc, name) => acc + `*${name}*: ${categories[name]}. \n`, '');
}

const formatScoreResponse = score => {
  return Object.keys(score)
    .reduce((acc, name) => acc + `${name}: ${score[name]} points. \n`, '');
}

const buildScoreObject = async seasonId => {
  const users = await models.User.find().lean();
  const pointsAggregate = await models.Point.aggregate([
    { $match: { seasonId } },
    { $group: { _id: "$userId", points: { $sum: 1 } } }
  ]);
  console.log('users---------------', pointsAggregate);

  return users.reduce((acc, user) => {
    const pointsObj = pointsAggregate.find(obj => obj._id === user._id.toString());
    const individualScore = pointsObj ? pointsObj.points : 0;
    const name = user.nickname || `${user.firstName} ${user.lastName[0]}.`;

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

      const response = content.seasonSelect;
      response.attachments[0].actions = actions;

      return response;
    }
    case 'viewCategories': {
      const currentSeason = await models.Season.findOne({ isActive: true });
      const stringifiedCategories = formatCategoryResponse(currentSeason.categories);
      
      return { text: `Current daily categories are: \n${stringifiedCategories}\n\n Type *"/trivia update categories: (comma separate values)"* to update the weekly categories` };
    }
    case 'help':
      return content.helpMenu;
  }
}


const handleButton = async (req) => {
  // console.log('---------------------',req.body);
  const request = JSON.parse(req.body.payload);
  // console.log('---------------', request)
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
        console.log('update-----------', activeSeason)
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
      const name = req.body.text.split(':')[1];
      if (!name) return { text: "New seasons need a name. Eg. *\"/trivia new season: Q2 2018\"*" };

      const activeSeason = await models.Season.findOne({ isActive: true });
      const confirmationResponse = content.newSeasonConfirmation;
      confirmationResponse.attachments[0].actions[0].value = name.trim();

      return activeSeason ? confirmationResponse : startNewSeason(name.trim());
    }
    case 'end season': {
      const activeSeason = await models.Season.findOne({ isActive: true });
      return activeSeason ? content.seasonEndConfirmation : { text: "No active seasons currently" }
    }
    default: 
      return { text: "My maker doesn't know NLP.. I only accept exact matches for commands :sob:" };
  }
};


module.exports = {
  handleButtonCommand: (req, res, next) => {
    handleButton(req)
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