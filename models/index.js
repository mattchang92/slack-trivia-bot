const models = require('../config').models;

models.forEach(model => {
  module.exports[model] = require(`./${model}`);
});