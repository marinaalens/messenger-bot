'use strict';

require('dotenv').config({silent: true});

const express = require('express');
const bodyParser = require('body-parser');
const Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk
const request = require('request');
const path = require('path');
const app = express();
const exphbs = require('express-handlebars');
const crypto = require('crypto');

// add any handlebar helper methods
let hbs = exphbs.create({
    helpers: {}
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname + '/js/views'));
app.enable('trust proxy');

// ------------------- Custom module import --------------------

let userStore = require('./js/data/userstore.js');
let templates = require('./js/templates.js');
let User = require('./js/model/User.js');
let Watson = require('./js/model/Watson.js');

// --------------------------- Watson --------------------------

let conversation = new Conversation({
    username: process.env.CONVERSATION_USERNAME,
    password: process.env.CONVERSATION_PASSWORD,
    version: 'v1',
    version_date: '2017-05-26',
    url: process.env.CONVERSATION_API
});

// ---------------------- Security Check -----------------------

// Checks the x-hub-signature, to make sure incoming messages are from Messenger. Prevents bot-spamming.

function getSignature(buf) {
    let hmac = crypto.createHmac("sha1", process.env.APP_SECRET);
    hmac.update(buf, "utf-8");
    return "sha1=" + hmac.digest("hex");
}

function verifyRequest(req, res, buf, encoding) {
    let expected = req.headers['x-hub-signature'];
    let calculated = getSignature(buf);
    console.log("X-Hub-Signature:", expected, "Content:", "-" + buf.toString('utf8') + "-");
    if (expected !== calculated) {
        throw new Error("Invalid signature.");
    } else {
        console.log("Valid signature!");
        return true;
    }
}
function abortOnError(err, req, res, next) {
    if (err) {
        console.log(err);
        res.status(400).send({ error: "Invalid signature." });
    } else {
        next();
    }
}

app.use(bodyParser.json({ verify: verifyRequest }));
app.use(abortOnError);

// --------------------------- Messenger -----------------------------

// Webhook validation
app.get('/webhook', function(req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

// Message processing
app.post('/webhook', function (req, res) {
    let data = req.body;
    // Make sure this is a page subscription
    if (data.object === 'page') {
        // Iterate over each entry - there may be multiple if batched
        data.entry.forEach(function(entry) {
            // Iterate over each messaging event
            // Secondary Receiver is in control - listen on standby channel
            if (entry.standby) {
                console.log("Bot on standby")
                // iterate webhook events from standby channel
                entry.standby.forEach(event => {
                    const psid = event.sender.id;
                    const message = event.message;
                });
            }
            if (entry.messaging) {
                entry.messaging.forEach(function(event) {
                    let senderId = event.sender.id;
                    if (event.message && event.message.text && !event.message.is_echo) {
                        receivedMessage(event);
                    } else if (event.postback) {
                        receivedPostback(event);
                    } else if (event.delivery) {
                        // this is sent each time a message is delivered to the user.
                        removeTypingBubble(senderId)
                    } else if (event.message && event.message.attachments[0].type === 'location') {
                        let location = {lat: event.message.attachments[0].payload.coordinates.lat, lng: event.message.attachments[0].payload.coordinates.long};
                        // Do something with the location
                    } else if (event.pass_thread_control) {
                        sendTextMessage(senderId, "Hello again! You're back from talking to an employee!");
                    } else {
                        console.log("Webhook received unknown event: ", event);
                    }
                });
            }
        });
        res.sendStatus(200);
    }
});

/**
 * Calls the Watson api with the user message and processes the returned Watson message.
 * @param message
 * @param user User object
 */
const watsonMessage = function(message, user) {
    let workspace = process.env.WORKSPACE_ID || '<workspace-id>';
    const senderID = user.getId();
    const payload = {
        workspace_id: workspace,
        input: {
            text: message
        },
        context: user.getWatson() ? user.getWatson().getContext() : {}
    };
    return new Promise(function (resolve, reject) {
        conversation.message(payload, function (err, data) {
            if (err) {
                reject(err);
            } else {
                if (data) {
                    console.log(data);
                    let buttons = data.output.buttons;
                    let savedButtonMessage;
                    if (buttons) {
                        buttons = getButtonsFromWatson(buttons, true); //always quick reply - change in actions if necessary.
                    }
                    // Save the latest watson answer to retain context
                    user.setWatson(new Watson(data));
                    if (data.output.action) {
                        // use action variables in watson and process actions here
                    } else if (data.output.text) {
                        let message = data.output.text;
                        // if text is an array of messages, loop over them.
                        if (message.constructor === Array) {
                            if (buttons) {
                                savedButtonMessage = message.pop();
                                loopMessages(senderID, message, function () {
                                    sendGenericMessage(templates.getQuickReply(savedButtonMessage, buttons, senderID), null);
                                });
                            } else {
                                loopMessages(senderID, message, function(){});
                            }
                        } else {
                            if (buttons) {
                                sendGenericMessage(templates.getQuickReply(message, buttons, senderID), null);
                            } else {
                                sendTextMessage(senderID, message);
                            }
                        }
                    } else {
                        console.log("Watson didn't return a message.")
                    }
                }
            }
        });
    });

};

/**
 * Provided a button array, the function will create Messenger buttons and return a new array.
 * @param buttons
 * @param isQuickReply if true, the array returned will be a quick reply array
 * @returns {*}
 */
function getButtonsFromWatson(buttons, isQuickReply) {
    if (buttons) {
        let actionButtons = [];
        buttons.forEach(function (button) {
            for (let i in button) {
                if (button.hasOwnProperty(i)) {
                    if (isQuickReply) {
                        actionButtons.push(templates.getQuickReplyButton(i + ' ', button[i]));
                    } else {
                        actionButtons.push(templates.getButton(i + ' ', button[i]));
                    }
                }
            }
        });
        return actionButtons;
    } else {
        return null;
    }
}

// Helper to ensure message order when there are multiple messages
let x = 0;
let loopMessages = function(recipientId, messages, callback) {
    sendMessage(recipientId, messages[x],function(){
        // set x to next item
        x++;
        if(x < messages.length) {
            loopMessages(recipientId, messages, callback);
        } else {
            x = 0;
            callback();
        }
    });
};

function sendMessage(id, message, callback) {
    sendTextMessageWithCallback(id, message, function (delivered) {
        if (delivered) {
            callback()
        }
    })
}

// Incoming events handling

function receivedMessage(event) {
    let senderID = event.sender.id;
    let pageID = event.recipient.id;
    let message = event.message;
    let messageAttachments = message.attachments;

    console.log("User says: " + message.text);

    // Make sure the message is processed like a postback and not a message if it's a quick reply.
    if (message.quick_reply) {
        receivedPostback(event);
        return;
    }

    let user = userStore.getUser(senderID);

    if (!user) {
        callUserAPI(senderID, function (user) {
            sendToWatson(message, user);
        });
    } else {
        sendToWatson(message, user);
    }
}

function sendToWatson(message, user) {
    if (message.text) {
        // view the typing bubble while the message is sent to Watson and processed. Remove it when the message is delivered.
        viewTypingBubble(user.getId());
        // Send the recieved message to Watson
        watsonMessage(message.text, user);
    } else if (message.sticker_id === 369239263222822) {
        // Example of a sticker check - this one is for the standard thumbs up sticker
        watsonMessage('okay', user);
    }
}

function receivedPostback(event) {
    let senderID = event.sender.id;
    let pageID = event.recipient.id;

    // The 'payload' param is a developer-defined field which is set in a postback
    let payload = event.postback ? event.postback.payload : event.message.quick_reply.payload;
    let user = userStore.getUser(senderID);

    if (!user) {
        callUserAPI(senderID, function (user) {
            processPayload(payload, user)
        });
    } else {
        processPayload(payload, user)
    }
}

function processPayload(payload, user) {
    const senderID = user.getId();
    switch (payload) {
        // the start_message payload is from the get started button. You can change this payload in the templates.
        case 'start_message':
            if (user) {
                sendTextMessageWithCallback(senderID, 'Hi there, ' + user.getName() + "!", function () {
                    watsonMessage("Help", user);
                });
            } else {
                sendTextMessageWithCallback(senderID, 'Hi there!', function () {
                    watsonMessage("Help", user);
                });
            }
            break;
        case 'contact':
        case 'kontakt':
            sendTextMessageWithCallback(senderID, "I'm transfering you to an employee. They will answer your message as soon as possible.", function () {
                passThreadControl(senderID, function () {
                    console.log("Handover completed")
                })
            });
            break;
        default:
            watsonMessage(payload, user); break;
    }
}

/**
 * Helper, which adds an ID to the message and calls the send API
 * @param recipientId
 * @param messageText
 */
function sendTextMessage(recipientId, messageText) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText
        }
    };
    callSendAPI(messageData);
}

/**
 * Sends a generic.
 * @param recipientId
 * @param messageText
 * @param callback that should be called when the message is delivered. Ensures message order.
 */
function sendTextMessageWithCallback(recipientId, messageText, callback) {
    let messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText
        }
    };
    callSendAPI(messageData, function (delivered) {
        if (callback) {
            callback(delivered);
        }
    });
}

function viewTypingBubble(recipientID) {
    let messageData = {
        recipient: {
            id: recipientID
        },
        "sender_action":"typing_on"
    };
    callSendAPI(messageData);
}

function removeTypingBubble(recipientID) {
    let messageData = {
        recipient: {
            id: recipientID
        },
        "sender_action":"typing_off"
    };
    callSendAPI(messageData);
}

/**
 * Sends a generic.
 * @param genericTemplate
 * @param callback that should be called when the message is delivered. Ensures message order.
 */
function sendGenericMessage(genericTemplate, callback) {
    callSendAPI(genericTemplate, function (delivered) {
        if (callback) {
            callback(delivered);
        }
    });
}

/**
 * Uploads an attachment to facebook
 * Use with attachment template
 * @param attachmentPayload
 * @param callback called if message was sent with success
 */
function callUploadAttachmentAPI(attachmentPayload, callback) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/message_attachments',
        qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: attachmentPayload

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            if (callback) {
                callback(true);
            }
        } else {
            console.error("Unable to send message.");
            console.error(body.error);
        }
    });
}

/**
 * Sends the message to facebook
 * @param messageData
 * @param callback called if message was sent with success
 */
function callSendAPI(messageData, callback) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: messageData

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            if (callback) {
                callback(true);
            }
        } else {
            console.error("Unable to send message.");
            console.error(body.error);
        }
    });
}

/**
 * Passes thread control to page
 * @param userId
 * @param callback
 */
function passThreadControl(userId, callback) {
    console.log('PASSING THREAD CONTROL');
    let payload = {
        recipient: {
            id: userId
        },
        target_app_id: 263902037430900
    };
    request({
        uri: 'https://graph.facebook.com/v2.6/me/pass_thread_control',
        qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: payload

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            if (callback) {
                callback(true);
            }
        } else {
            console.error("Unable to pass control to app.");
            console.error(body.error);
        }
    });
}

/**
 * Set bot settings e.g. welcome message and get started button
 * Add the call in the app.listen method, run once and remove.
 * @param props the properties to set
 */
function callPagePropAPI(props) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messenger_profile',
        qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: props

    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.error("Settings are set!");
        } else {
            console.error("Unable to set settings.");
            console.error(body.error);
        }
    });
}

/**
 * Sends the message to facebook
 * @param userID
 * @param callback
 */
function callUserAPI(userID, callback) {
    request({
        url: 'https://graph.facebook.com/v2.6/'+ userID +'?fields=first_name,locale',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'GET'
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            let data = JSON.parse(body);
            // create a new user object with the id, name and locale for future use.
            let user = new User(data.id, data.first_name, data.locale);
            userStore.addUser(user);
            if (callback) {
                callback(user)
            }
        } else {
            console.error("Unable to send message.");
            console.error(body);
        }
    });
}

/**
 * Calls the Graph API - change according to your needs
 * @param callback
 */
function callGraphApi(callback) {
    request({
        url: 'https://graph.facebook.com/v2.6/search?fields=name,about,price_range,description,cover',
        qs: {
            access_token: process.env.PAGE_ACCESS_TOKEN,
            type: 'place',
            q: 'your_query',
            center: 'some lat' + "," + 'some lng',
            distance: '1000'
        },
        method: 'GET'
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            let data = JSON.parse(body);
            if (data) {
                callback(data.data[0]);
            }
        } else {
            console.error("Unable to send message.");
            console.error(body.error.message);
        }
    });
}

// ------------------- Server -----------------------

let port = process.env.PORT || process.env.VCAP_APP_PORT || 3000;

app.listen(port, function() {
    console.log('Server running on port: %d', port);


    // uncomment these and start server to set settings of the page

    /*callPagePropAPI({
     "whitelisted_domains":[]
     });
    callPagePropAPI(templates.getGreeting());
    callPagePropAPI(templates.getStartButton());*/
});
