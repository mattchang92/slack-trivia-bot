const models = require('../../models');
const content = require('../../content');
const config = require('../../config');

const formatCategoryResponse = categories => {
  return Object.keys(categories)
    .filter(name => config.days.includes(name))
    .reduce((acc, name) => acc + `*${name}*: ${categories[name]}. \n`, '');
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
      // console.log(actions);
      return response;
    }
    case 'viewCategories': {
      const currentSeason = await models.Season.findOne({ isActive: true });
      const stringifiedCategories = formatCategoryResponse(currentSeason.categories);
      
      return { text: `Current daily categories are: \n${stringifiedCategories}\n\n Type *"/trivia update categories: (comma separate values)"* to update the weekly categories` };
    }
  }
}


const handleButton = async (req) => {
  // console.log('---------------------',req.body);
  const request = JSON.parse(req.body.payload);
  console.log('---------------', request)
  const action = request.actions[0];
  switch(request.callback_id) {
    case 'topLevelNav': {
      return handleTopLevelNav(request, action);
    }
    case 'seasonSelect': {
      const _id = request.actions[0].value;
      const season = await models.Season.findOne({ _id });
      if (season.score) {
        const stringifiedScore = Object.keys(season.score)
          .reduce((acc, name) => acc + `${name}: ${season.score[name]} points. \n`, '');

        return { text: stringifiedScore };
      }
    }
  }
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