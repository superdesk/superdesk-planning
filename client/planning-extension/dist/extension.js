"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
function onSpike(superdesk, item) {
    var gettext = superdesk.localization.gettext;
    if (item.assignment_id != null) {
        return Promise.resolve({
            warnings: [
                {
                    text: gettext('This item is linked to in-progress planning coverage.'),
                },
            ],
        });
    }
    else {
        return Promise.resolve({});
    }
}
function onSpikeMultiple(superdesk, items) {
    var gettext = superdesk.localization.gettext;
    var itemsWithAssignmentsExist = items.some(function (item) { return item.assignment_id != null; });
    if (itemsWithAssignmentsExist) {
        return Promise.resolve({
            warnings: [
                {
                    text: gettext('Some items are linked to in-progress planning coverage.'),
                },
            ],
        });
    }
    else {
        return Promise.resolve({});
    }
}
function onPublishArticle(superdesk, item) {
    if (!superdesk || !superdesk.instance || !superdesk.instance.config) {
        return Promise.resolve({});
    }
    var config = superdesk.instance.config;
    if (config && config.planning_check_for_assignment_on_publish) {
        var assignmentService = utils_1.getAssignmentService();
        return assignmentService.onPublishFromAuthoring(item);
    }
    return Promise.resolve({});
}
function onArticleRewriteAfter(superdesk, item) {
    if (!superdesk || !superdesk.instance || !superdesk.instance.config) {
        return Promise.resolve(item);
    }
    var config = superdesk.instance.config;
    if (config && config.planning_link_updates_to_coverage) {
        var assignmentService = utils_1.getAssignmentService();
        return assignmentService.onArchiveRewrite(item);
    }
    return Promise.resolve(item);
}
function onSendBefore(superdesk, items, desk) {
    if (!superdesk || !superdesk.instance || !superdesk.instance.config) {
        return Promise.resolve();
    }
    var config = superdesk.instance.config;
    if (!config || !config.planning_check_for_assignment_on_send) {
        return Promise.resolve();
    }
    // If the destination desk is a production desk
    // and there are items provided, then call onSendFromAuthoring
    if (desk && desk.desk_type === 'production' && items.length > 0) {
        var assignmentService = utils_1.getAssignmentService();
        return assignmentService.onSendFromAuthoring(items);
    }
    return Promise.resolve();
}
var extension = {
    id: 'superdesk-planning',
    activate: function (superdesk) {
        var result = {
            contributions: {
                entities: {
                    article: {
                        onSpike: function (item) { return onSpike(superdesk, item); },
                        onSpikeMultiple: function (items) { return onSpikeMultiple(superdesk, items); },
                        onPublish: function (item) { return onPublishArticle(superdesk, item); },
                        onRewriteAfter: function (item) { return onArticleRewriteAfter(superdesk, item); },
                        onSendBefore: function (items, desk) { return onSendBefore(superdesk, items, desk); },
                    },
                },
            },
        };
        return Promise.resolve(result);
    },
};
exports.default = extension;
