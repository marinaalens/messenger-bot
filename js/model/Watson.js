module.exports = function Watson(latestPayload) {
    this.latestPayload = latestPayload;
    this.context = latestPayload.context;

    this.getLatestPayload = function() {
        return this.latestPayload;
    };

    this.getContext = function() {
        return this.context;
    };

    /**
     * A helper that searches for an entity by providing an entity name e.g. "mood" and returning a value e.g. "happy" if the entity exists.
     * @param entity the entity to search for
     * @param entities the array of entities to be searched
     * @return String if found, the entity value or null if not found
     */
    this.findEntity = function(entity, entities) {
        let entityValue = null;
        let values = [];
        entities.forEach(function(e) {
            if (e.entity === entity) {
                if (e.confidence > 0.7) {
                    entityValue = e;
                    values.push(e);
                }
            }
        });
        //check for multiple values, and return the one with the highest confidence
        if (values.length > 1) {
            values.forEach(function(value) {
                if (value.confidence > entityValue.confidence) {
                    entityValue = value;
                }
            });
        }

        return entityValue ? entityValue.value : null;
    }
};
