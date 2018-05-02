require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const content = require('./content');
const router = require('./router');

const { addNonExistingUser } = require('./middleware');

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

app.use('/', addNonExistingUser);

app.use(router);

app.listen(process.env.SERVER_PORT, () => {
  console.log(`Server listening on port: ${process.env.SERVER_PORT}`);
})