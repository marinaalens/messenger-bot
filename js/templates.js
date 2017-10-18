let templates = (function() {

    return {
        getGenericWithWebView: getGenericWithWebView,
        getGenericList: getGenericList,
        getPayloadButton: getPayloadButton,
        getQuickReply: getQuickReply,
        getQuickReplyLocation: getQuickReplyLocation,
        getGreeting: getGreeting,
        getStartButton: getStartButton
    };

    /**
     * Returns a generic payload for a message with an image and a button that links to a webview.
     * @param title
     * @param subtitle
     * @param url
     * @param imageUrl
     * @param buttonTitle
     * @param height The height of the webview. Either "compact", "tall", or "full"
     * @returns a generic message with a webview
     */
    function getGenericWithWebView(title, subtitle, url, imageUrl, buttonTitle, height) {
        return {
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
     * @param height The height of the webview. Either "compact", "tall", or "full"
     * @returns payload for the message
     */
    function getGenericList(elements, url, buttonTitle, height) {
        return {
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
     * Returns a button with a title and a payload
     * @param payload
     * @param buttonTitle
     * @param message
     * @returns A button
     */
    function getPayloadButton(payload, buttonTitle, message) {
        return {
            "message":{
                "attachment":{
                    "type":"template",
                    "payload":{
                        "template_type":"button",
                        "text": message,
                        "buttons":[
                            {
                                "type":"postback",
                                "payload": payload,
                                "title": buttonTitle
                            }
                        ]
                    }
                }
            }
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
                    "text":"Hi {{user_first_name}}. Tap 'get started' to begin chatting with me."
                }, {
                    "locale":"en_US",
                    "text":"Hi {{user_first_name}}. Tap 'get started' to begin chatting with me."
                }
            ]
        }
    }

    /**
     * Returns a quick reply
     * @param title
     * @param text
     * @param payload
     * @returns a quick reply button payload
     */
    function getQuickReply(title, text, payload) {
        return {
            "message":{
                "text": text,
                "quick_replies":[
                    {
                        "content_type":"text",
                        "title": title,
                        "payload": payload
                    }
                ]
            }
        }
    }

    /**
     * Returns a quick reply for getting the user location
     * @param text
     * @returns send location quick reply
     */
    function getQuickReplyLocation(text) {
        return {
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