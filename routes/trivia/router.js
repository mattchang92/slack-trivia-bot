const router = require('express').Router();
const handler = require('./handler');

router.get('/', handler.getCollection);

module.exports = router;
