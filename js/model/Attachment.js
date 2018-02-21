/**
 * Created by Marina on 21/02/2018.
 */
module.exports = function Attachment(id, name) {
    this.name = name;
    this.id = id;

    this.getName = function() {
        return this.name;
    };

    this.getId = function() {
        return this.id;
    };
};
