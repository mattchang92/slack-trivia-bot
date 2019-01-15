const moment = require('moment-timezone');

const models = require('../../models');
const content = require('../../content');
const config = require('../../config');

const axios = require('axios');

const adminIds = [process.env.RUBY_SLACK_ID];

const {
  formatCategoryResponse,
  formatScoreResponse,
  sendAwardPointTemplate,
  sendPermissionDeniedTemplate,
  cancelPoint,
  buildScoreObject
} = require('./helpers');

const handleTopLevelNav = async (request, action) => {
  switch(action.name) {
    case 'score': {
      const seasons = await models.Season.find().sort({ 'startDate': -1 });
      const lastFourSeasons = seasons.slice(0, 4);
      const actions = lastFourSeasons.map(season => ({
        name: season.seasonName,
        text: season.isActive ? "Current Season" : season.seasonName,
        type: 'button',
        value: season._id,
        style: season.isActive ? 'danger' : '',
      }));

      const response = content({ actions }).seasonSelect;

      return response;
    }
    case 'nickname':
      const slackId = request.user.id;

      if (slackId && adminIds.includes(slackId)) {
        const users = await models.User.find().lean();
        const nameSelection = users.map(user => ({
          label: `${user.firstName} ${user.lastName} (${user.nickname || 'Not set'})`,
          value: user.slackId,
        }));
  
        const options = {
          url: 'https://slack.com/api/dialog.open',
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.BOT_ACCESS_TOKEN}`
          },
          data: content({ 
            trigger_id: request.trigger_id,
            callback_id: request.callback_id,
            nameSelection,
           }).nicknameUpdate,
        }
  
        axios.request(options);
        return { text: 'Updating nicknames..' };
      } else {
        const user = await models.User.findOne({ slackId });
        if (user.nickname) {
          return { text: `Your nickname is: *${user.nickname}*` };
        } else {
          return { text: `You don't have a nickname set yet. Go bug Ruby :wink:` }
        }
      }

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
  }
}

const handleDialog = async (request) => {  
  switch(request.callback_id) {
    case 'nicknameUpdate': {
      const { slackId, updatedNickname } = request.submission;
      const selectedUser = await models.User.findOne({ slackId });
    
      if (selectedUser) {
        selectedUser.nickname = updatedNickname;
        await selectedUser.save();
      }
      break;
    }
  }

  return {};
};

const handleInteractive = async (req) => {
  const request = JSON.parse(req.body.payload);
  console.log(JSON.stringify(request, null, 2))
  if (request.type === 'dialog_submission') return handleDialog(request);
  if (!request.actions) return;
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
    // case 'question': {
    //   return { text: "Coming soon..." };
    //   const input = req.body.split(':').slice(1).join('');
    //   const splitInput = input.split('@');
    //   if (splitInput.length === 1) {
    //     return { text: 'A time must be specified' };
    //   } else if (splitInput.length > 2) {
    //     return { text: 'Sorry but "@" is a reserved to specify the question delivery time' };
    //   } else {
    //     const question = splitInput[0].trim();
    //     const time = splitInput[1].trim();
    //   }
    // }
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
