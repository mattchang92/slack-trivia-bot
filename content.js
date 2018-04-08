module.exports = {
  topLevel: {
    text: 'What would you like to do?',
    color: '#FFB84C',
    response_type: 'ephemeral',
    attachments: [
      {
        callback_id: 'topLevelNav',
        text: "pick one",
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
      }
    ]
  },
}