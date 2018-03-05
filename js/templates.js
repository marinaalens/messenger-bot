let templates = (function() {

    return {
        getGenericWithWebView: getGenericWithWebView,
        getGenericList: getGenericList,
        getPayloadButtons: getPayloadButtons,
        getQuickReply: getQuickReply,
        getQuickReplyLocation: getQuickReplyLocation,
        getGreeting: getGreeting,
        getStartButton: getStartButton,
        getButton: getButton,
        getWebviewButton: getWebviewButton,
        getQuickReplyButton: getQuickReplyButton,
        getAttachment: getAttachment,
        getAttachmentMessage: getAttachmentMessage
    };

    /**
     * Returns a generic payload for a message with an image and a button that links to a webview.
     * @param title
     * @param subtitle
     * @param url
     * @param imageUrl
     * @param buttonTitle
     * @param recipientId the id of the user
     * @param height The height of the webview. Either "compact", "tall", or "full"
     * @returns a generic message with a webview
     */
    function getGenericWithWebView(title, subtitle, url, imageUrl, buttonTitle, height, recipientId) {
        return {
            "recipient": {
                "id": recipientId
            },
            "message":{
                "attachment":{
                    "type":"template",
                    "payload":{
                        "template_type":"generic",
                        "elements":[
                            {
                                "title": title,
                                "image_url": imageUrl,
                                "subtitle": subtitle,
                                "buttons":[
                                    {
                                        "type": "web_url",
                                        "title": buttonTitle,
                                        "url": url,
                                        "messenger_extensions": true,
                                        "webview_height_ratio": height
                                    }
                                ]
                            }
                        ]
                    }
                }
            }
        }
    }

    /**
     * Returns a generic list with a button that links to a webview.
     * @param elements an array of list elements. The first element can contain an image.
     Example: [
     {
         "title": title,
         "image_url": imageUrl
     },
     {
         "title": title,
         "subtitle": subtitle
     },
     {
         "title": title,
         "subtitle": subtitle,
         "image_url": imageUrl
     }
     ]
     * @param url
     * @param buttonTitle
     * @param recipientId the id of the user
     * @param height The height of the webview. Either "compact", "tall", or "full"
     * @returns payload for the message
     */
    function getGenericList(elements, url, buttonTitle, height, recipientId) {
        return {
            "recipient": {
                "id": recipientId
            },
            "message": {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "sharable": false,
                        "template_type": "list",
                        "top_element_style": "large",
                        "elements": elements,
                        "buttons":[
                            {
                                "type": "web_url",
                                "title": buttonTitle,
                                "url": url,
                                "messenger_extensions": true,
                                "webview_height_ratio": height,
                            }
                        ]
                    }
                }
            }
        }
    }

    /**
     * Returns an attachment payload, which can be used to upload attachments to Facebook.
     * When uploaded, an attachement id will be returned which can then be used to send the attachment to the user (see getAttachmentMessage)
     * is_reusable is always true, which means the attachment id returned can be reused with other users
     * @param recipientId
     * @param type image - video - audio - file
     * @param url
     * @returns {{recipient: {id: *}, message: {attachment: {type: *, payload: {is_reusable: boolean, url: string}}}}}
     */
    function getAttachment(recipientId, type, url) {
        return {
            "recipient": {
                "id": recipientId
            },
            "message": {
                "attachment":{
                    "type": type,
                    "payload":{
                        "is_reusable": true,
                        "url": url
                    }
                }
            }
        }
    }

    /**
     * Returns a payload with an attachment. The attachment id can be acquired by using getAttachment()
     * @param recipientId
     * @param type
     * @param attachmentId
     * @returns {{recipient: {id: *}, message: {attachment: {type: *, payload: {attachment_id: *}}}}}
     */
    function getAttachmentMessage(recipientId, type, attachmentId) {
        return {
            "recipient": {
                "id": recipientId
            },
            "message": {
                "attachment":{
                    "type": type,
                    "payload":{
                        "attachment_id": attachmentId
                    }
                }
            }
        }
    }

    /**
     * Returns a message with buttons
     * @param recipientId the id of the user
     * @param message
     * @param buttons the buttons - use getButton to create them
     * @returns A button
     */
    function getPayloadButtons(buttons, message, recipientId) {
        return {
            "recipient": {
                "id": recipientId
            },
            "message":{
                "attachment":{
                    "type":"template",
                    "payload":{
                        "template_type":"button",
                        "text": message,
                        "buttons": buttons
                    }
                }
            }
        }
    }

    /**
     * Returns a button to be used with getPayloadButtons
     * @param payload
     * @param buttonTitle
     * @returns {{type: string, payload: *, title: *}}
     */
    function getButton(payload, buttonTitle) {
        return {
            "type":"postback",
            "payload": payload,
            "title": buttonTitle
        }
    }

    /**
     * @param url
     * @param buttonTitle
     * @param height The height of the webview. Either "compact", "tall", or "full"
     * @returns {{type: string, title: *, url: *, messenger_extensions: boolean, webview_height_ratio: *}}
     */
    function getWebviewButton(buttonTitle, url, height) {
        return {
            "type": "web_url",
            "title": buttonTitle,
            "url": url,
            "messenger_extensions": true,
            "webview_height_ratio": height
        }
    }

    /**
     * Returns a greeting for the get started screen. Use this as a parameter in the CallPropsAPI method, to set the greeting.
     * @returns
     */
    function getGreeting() {
        return {
            "setting_type":"greeting",
            "greeting":[
                {
                    "locale":"default",
                    "text":'Hi {{user_first_name}}. Press "Get started" to chat!'
                }
            ]
        }
    }

    /**
     * Returns a quick reply
     * @param text
     * @param buttons the quick reply buttons. Generate with getQuickReplyButton
     * @param recipientId the id of the user
     * @returns a quick reply button payload
     */
    function getQuickReply(text, buttons, recipientId) {
        return {
            "recipient": {
                "id": recipientId
            },
            "message":{
                "text": text,
                "quick_replies": buttons
            }
        }
    }

    /**
     * @param title
     * @param payload
     * @returns {{content_type: string, title: *, payload: *}}
     */
    function getQuickReplyButton(title, payload) {
        return {
            "content_type":"text",
            "title": title,
            "payload": payload
        }
    }

    /**
     * Returns a quick reply for getting the user location
     * @param text
     * @param recipientId the id of the user
     * @returns send location quick reply
     */
    function getQuickReplyLocation(text, recipientId) {
        return {
            "recipient": {
                "id": recipientId
            },
            "message":{
                "text": text,
                "quick_replies":[
                    {
                        "content_type":"location"
                    }
                ]
            }
        }
    }

    /**
     * Returns a start button, which can be used to set the get started button on the bot. Use with the callPropsAPI as a parameter.
     * @returns {{get_started: {payload: string}}}
     */
    function getStartButton() {
        return {
            "get_started":{
                "payload":"start_message"
            }
        }
    }

}());

module.exports = templates;