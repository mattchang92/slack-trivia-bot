const router = require('express').Router();
const handler = require('./handler');
const content = require('../../content');
// router.get('/', handler.getCollection);

router.get('/', (req, res, next) => {
  console.log('getting /');
})

router.post('/', (req, res, next) => {
  console.log(req.body);
  if (req.body.payload) {
    handler.handleInteractiveCommand(req, res, next);
  } else if (req.body.text) {
    handler.handleTextCommand(req, res, next);
  } else {
    res.json(content().topLevel)
  }
})

module.exports = router;
