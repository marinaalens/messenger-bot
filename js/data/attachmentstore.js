/**
 * Created by Marina on 21/02/2018.
 */
let attachmentStore = (function () {
    let attachments = [];
    return {
        getAllAttachments: function () {
            return attachments;
        },
        getAttachment: getAttachment,
        getAttachmentByName: getAttachmentByName,
        addAttachment: addAttachment
    };

    /**
     * Gets an attachment with attachment id
     * @param id the attachment id
     * @returns attachment
     */
    function getAttachment(id) {
        let index = attachments.map(function(x) {return x.id; }).indexOf(id);
        return attachments[index];
    }

    /**
     * Gets an attachment with attachment name
     * @param name the attachment name
     * @returns attachment
     */
    function getAttachmentByName(name) {
        let index = attachments.map(function(x) {return x.name; }).indexOf(name);
        return attachments[index];
    }

    function addAttachment(attachment) {
        attachments.push(attachment);
    }
}());

module.exports = attachmentStore;