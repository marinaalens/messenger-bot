# Facebook Messenger Chatbot
## This project is a template for a facebook bot.
### The project is configured to use Watson Conversation.
#### Below are the setup instruction steps to get started with the project:

## Setup

1. run `npm install` to install dependencies.
   - express-handlebars and moment are optional. Remove them before running install if you don't need them.
2. go to the env file and input all variables.
   - This requires a conversation instance, a conversation workspace and a facebook page with a webhook.
   - Check the conversation API in the .env file and change if necessary to the API of your region.
3. If you want the bot to have a greeting message and a get started button, call the 'callPagePropAPI' function with the parameters you want to set.
   - Call the function where the server is started, and remove after the settings are set.
   - You can use the templates "getStartButton" and "getGreeting". For example -> callPagePropAPI(templates.getGreeting())

## Intro

In templates.js you will find some message templates. You can add more to tailor the templates to your needs.
For documentation see https://developers.facebook.com/docs/messenger-platform/send-messages/templates

When a message is recieved, the headers are checked for the x-hub-signature to prevent bot spamming.
After this, the message is processed in POST /webhook.
If the message is a regular text message, the message will be forwarded to watson via the watsonMessage function.
When Watson responds, the response will be sent back to the user.

Please let me know if you have questions.

## Copyright

All rights reserved, Chatbot Interactive - https://chatbotinteractive.com