# Finn Trivia Slack Bot

This slack bot is for helping manage the quarterly trivia competitions at Finn. It is meant for internal use/for fun only.

## Handling Requests
Besides the top level nav which can be triggered by `/trivia`, there are two types of requests. Text based commands (Slack calls these slash commands) and interactive commands. Text based commands are also initiated with /trivia but include an argument after (eg `/trivia points`). Currently supported arguments are `update categories, new season, end season, points, help` and are direct string matches, anything else returns a generic error response. Interactive commands covers everything else including button clicks and form inputs.

## Sending Responses
Basic text only responses can be handled by simply returning an object of format `{ text: "Hello World" }`. Interactive messages (forms/buttons) request a more complex object and are stored in `content.js`. You can read more about these here https://api.slack.com/interactive-messages. These cover the majority of the non-text responses with the exception being the nickname update feature. This requires a more complex form called a dialog and this is triggered not by returning an object but by sending an API request to the `https://slack.com/api/dialog.open` endpoint.

## Models
Work was started on the question adding feature but it was never fully implemented since Ruby liked asking the questions herself. As such, the Question model is not currently being used. For the first two seasons, the scores were imported from Ruby's spreadsheet and is stored as a `score` object on the season themselves. All points afterwards are stored as individual records in the database so it's easy to add/subtract and group by seasons. Score fetching is done through MongoDB's aggregate pipeline. Authentication is done by checking Slack IDs, only Ruby's ID can perform actions like adding points and starting/ending seasons. When an unrecognized Slack ID interacts with the bot for the first time, they will be automatically added to the database.