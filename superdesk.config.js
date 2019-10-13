module.exports = function(grunt) {
    return {
        // When installing superdesk-core into planning, extensions are compiled
        // so disabling them here to stop that
        enabledExtensions: {},
    };
};
