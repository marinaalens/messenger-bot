module.exports = function User(id, name, locale) {
    this.name = name;
    this.id = id;
    this.location = null;
    this.locale = locale;
    this.Watson = null;

    this.setLocation = function(location) {
        this.location = location;
    };

    this.getLocation = function() {
        return this.location;
    };

    this.setName = function(name) {
        this.name = name;
    };

    this.getName = function() {
        return this.name;
    };

    this.getId = function() {
        return this.id;
    };
    this.getWatson = function() {
        return this.Watson;
    };
    this.setWatson = function(watson) {
        this.Watson = watson;
    };
};



