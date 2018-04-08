require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
// const cors = require('cors');

// const index = require('./routes/index');
// const slack = require('./routes/slack');
// const tokens = require('./routes/api/v1/tokens');
// const teams = require('./routes/api/v1/teams');
// const users = require('./routes/api/v1/users');

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URL);
mongoose.connection.once('open', () => {
  console.log('Connected to Mongo database');
});
mongoose.connection.on('error', (error) => {
  console.log('Error connecting to database: ', error)
});

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(cors());

app.get('/', (req, res, next) => {
  console.log('getting /');
})

app.post('/', (req, res, next) => {
  console.log('posting /', req.body);
  res.send('hello world')
})

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server listening on port: ${process.env.SERVER_PORT}`);
})