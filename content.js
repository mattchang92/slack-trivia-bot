module.exports = (options = {}) => (
  {
    topLevel: {
      text: 'What would you like to do?',
      color: '#FFB84C',
      response_type: 'ephemeral',
      attachments: [
        {
          callback_id: 'topLevelNav',
          text: "Select one of the following",
          attachment_type: "default",
          actions: [
            {
              name: 'score',
              text: 'View Scoreboard',
              type: 'button',
              value: 'scoreSelect'
            },
            {
              name: 'question',
              text: 'Enqueue Question',
              type: 'button',
              value: 'addQuestion'
            },
            {
              name: 'viewCategories',
              text: 'View Question Categories',
              type: 'button',
              value: 'viewCategories'
            },
            {
              name: 'help',
              text: 'Help',
              type: 'button',
              value: 'help'
            },
          ]
        }
      ]
    },
    seasonSelect: {
      text: "Which season's score would you like to check?",
      color: '#FFB84C',
      response_type: 'ephemeral',
      attachments: [
        {
          callback_id: 'seasonSelect',
          attachment_type: "default",
          text: 'Please select a season',
          actions: options.actions,
        }
      ]
    },
    seasonEndConfirmation: {
      text: "Are you sure you'd like to end the current season?",
      response_type: 'ephemeral',
      attachments: [
        {
          callback_id: 'endSeason',
          text: "Select one of the following",
          attachment_type: "default",
          actions: [
            {
              name: 'yes',
              text: 'Yes',
              type: 'button',
              value: 'yes'
            },
            {
              name: 'no',
              text: 'No',
              type: 'button',
              value: 'no'
            },
          ]
        }
      ]
    },
    newSeasonConfirmation: {
      text: "There's already an active season. Would you like to end it and start a new one?",
      response_type: 'ephemeral',
      attachments: [
        {
          callback_id: 'startNewSeason',
          text: "Select one of the following",
          attachment_type: "default",
          actions: [
            {
              name: 'yes',
              text: 'Yes',
              type: 'button',
              value: options.value,
            },
            {
              name: 'no',
              text: 'No',
              type: 'button',
              value: 'no'
            },
          ]
        }
      ]
    },
    awardPoint: {
      text: "Who would you like to award a point to?",
      attachments: [
        {
          attachment_type: "default",
          callback_id: "awardPoint",
          text: '',
          actions: [
            {
              name: "awardPoint",
              text: "pick a person",
              type: "select",
              options: options.nameSelection
            }
          ]
        }
      ]
    },
    awardPointAndThen: {
      text: `1 point awarded to ${options.name}`,
      color: '#FFB84C',
      response_type: 'ephemeral',
      attachments: [
        {
          callback_id: 'awardPointAndThen',
          text: "Anything else?",
          attachment_type: "default",
          actions: [
            {
              name: 'anotherPoint',
              text: 'Award Another Point',
              type: 'button',
              value: 'anotherPoint',
              style: 'primary',
            },
            {
              name: 'cancelPoint',
              text: 'Cancel Point',
              type: 'button',
              value: options.pointId,
              style: 'danger',
            },
          ]
        }
      ]
    },
    helpMenu: {
      text: "Available commands are:\n*'/trivia new season: ENTER NAME'*: Starts off a new trivia season (name required).\n*'/trivia end season'*: ends the current trivia season.\n*'/trivia update categories: (comma separated values)'*: to update the weekly categories\n*'/trivia points'*: opens up the award points menu"
    },
    permissionDeniedTemplate: {
      text: options.text,
        attachments: [
          {
            text: '',
            image_url: options.gif
          }
        ]
    },
    permissionDeniedText: [
      "I'm sorry Dave, I'm afraid I can't do that",
      "Wait a second you're not Ruby",
      "Only Ruby-Bot can assign points",
      "You're not Ruby.. :thinking_face:",
      "Hey.. you.. stop that! I'm watching you :cop:",
      "Nice try, but nope.",
      "Hey knock that out!"
    ],
    permissionDeniedGifs: [
      "http://78.media.tumblr.com/tumblr_lxdyy4Lmeb1r4kfic.gif",
      "http://www.reactiongifs.com/r/2013/06/no-def-not.gif",
      "https://media.giphy.com/media/l4HnXMxrPGGXmDHW0/giphy.gif",
      "http://www.reactiongifs.com/r/nsh.gif",
      "https://media.giphy.com/media/JYZ397GsFrFtu/giphy.gif'",
    ]
  }
)
