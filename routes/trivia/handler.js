// const apiGet = require('../../helpers').apiGet;
// const config = require('../../config');

// const getLaunches = (req) => {
//   const today = new Date();

//   // return apiGet(`/launch/${today.toISOString().split('T')[0]}?limit=50`);
//   return apiGet(`/launch/${today.toISOString().split('T')[0]}?limit=${req.query.limit}`);
// }

// const getLaunch = (req) => {
//   return apiGet(`/launch/${req.params.id}`);
// }

// module.exports = {
//   getCollection: (req, res, next) => {
//     getLaunches(req)
//       .then((response) => {
//         res.status(200).send(response);
//         next();
//       })
//       .catch((err) => {
//         res.status(404).send(err);
//         next(err);
//       })
//   },
// }
