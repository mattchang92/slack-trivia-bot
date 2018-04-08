const express = require('express');
const router = express.Router();

// const routes = require('./config').routes;

// // Enable cors request from front-end
// router.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

// Can extend routes by adding extra routes to the config file
// Object.keys(routes).forEach((route) => {
//   router.use(routes[route], require(`./routes/${route}/router`));
// })

router.use('/slack', require('./routes/slack/router'));

module.exports = router;