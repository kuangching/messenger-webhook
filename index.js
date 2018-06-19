/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * Starter Project for Messenger Platform Quick Start Tutorial
 *
 * Use this project as the starting point for following the
 * Messenger Platform quick start tutorial.
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 */

'use strict';

// Imports dependencies and set up http server
const
    request = require('request'),
    express = require('express'),
    body_parser = require('body-parser'),
    app = express().use(body_parser.json()); // creates express http server

const PAGE_ACCESS_TOKEN = 'EAADveDdj9tABAMR7gSlgqLOH53gMJRWr9WEozElAMrRwzsHt1JQ8qZCMAqr0MO4BeR9sNeE9PAXjZCXN8s21cMabNHUfdZBpCqqECtPcKUQANcWcplL1ulvCICbWYZCnjIz6BZCEBZBIGmk16OaqBL6rtCTi7jdHKclfzT3ZChXkwZDZD';

var apiai = require('apiai');
var apiaiapp = apiai('83c8cbe12da743ff823cadbd60df09ae', '4d68a32def6841d7b26813cdca3bdc8f');

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {

    // Parse the request body from the POST
    let body = req.body;

    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {

            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }
        });

        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {

    /** UPDATE YOUR VERIFY TOKEN **/
    const VERIFY_TOKEN = PAGE_ACCESS_TOKEN;

    // Parse params from the webhook verification request
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Check if a token and mode were sent
    if (mode && token) {

        // Check the mode and token sent are correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Respond with 200 OK and challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});

// Handles messages events
function handleMessage(sender_psid, received_message) {

    let response;
    let strStation;
    let arrStation;
    var request = apiaiapp.textRequest(received_message.text, {sessionId: sender_psid});
    request.on('response', function(response){
        if(response.result.action == "train"){
            strStation = response.result.parameters.start_station;
            arrStation = response.result.parameters.arrive_station;
            console.log('起點'+strStation);
            console.log('終點'+arrStation);
        }else {
            // Check if the message contains text
            if (received_message.text) {
                switch (received_message.text) {
                    case '公道價八萬一' :
                        response = {
                            "text": '你在大聲甚麼啦!'
                        };
                        break;
                    case 'structure' :
                        callSendStructuredAPI(sender_psid);
                        break;
                    case 'default' :
                        response = {
                            "text": `You sent the message: "${received_message.text}". Now send me an image!`
                        };
                        break;
                }
            } else if (received_message.attachments) {
                response = {
                    "text": `這是附件`
                };
            }
        }
        // Sends the response message
        if(received_message.text != 'structure'){
            callSendAPI(sender_psid, response);
        }
    });
    request.end();


}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {

}

function callSendStructuredAPI(sender_psid){
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [{
                        title: '這是對的圖嗎?',
                        subtitle: '按下按鈕吧',
                        image_url: 'https://i.imgur.com/i9jFz7I.jpg',//'https://upload.wikimedia.org/wikipedia/ah/thumb/5/5d'
                        buttons: [
                            {
                                type: "postback",
                                title: "yes",
                                payload: "yes"
                            },
                            {
                                type: "postback",
                                title: "no",
                                payload: "no"
                            }
                        ],
                    }]
                }
            }
        }
    };

    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}


// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": PAGE_ACCESS_TOKEN },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}