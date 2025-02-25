import React from 'react';
import {get} from 'lodash';
import moment from 'moment';
import {AbsoluteDate} from '../components';
import {HISTORY_OPERATIONS, POST_STATE} from '../constants';
import {getItemInArrayById} from './index';

const getPlanningItemHistory = (historyItems = []) => {
    let history = [];

    historyItems.forEach((item) => {
        if (!get(item, 'update.coverage_id')) {
            // This is a planning item history
            history.push(item);
        }
    });
    return history;
};

const getGroupedCoverageHistory = (historyItems = []) => {
    let covHistory = {};

    historyItems.forEach((item) => {
        if (get(item, 'update.coverage_id')) {
            if (!get(covHistory, item.update.coverage_id)) {
                covHistory[item.update.coverage_id] = {
                    items: [],
                    planning: {},
                    assigned_to: {},
                };
            }

            covHistory[item.update.coverage_id].items = [...covHistory[item.update.coverage_id].items, item];
            // Write the latest coverage information on the data to be used for display card
            if (get(item, 'update.planning.g2_content_type')) {
                covHistory[item.update.coverage_id].planning.g2_content_type = item.update.planning.g2_content_type;
            }

            if (get(item, 'update.planning.scheduled')) {
                covHistory[item.update.coverage_id].planning.scheduled = moment(item.update.planning.scheduled);
            }

            if (get(item, 'update.assigned_to')) {
                covHistory[item.update.coverage_id].assigned_to = {
                    ...covHistory[item.update.coverage_id].assigned_to,
                    ...item.update.assigned_to,
                };
            }

            if (get(item, 'update.workflow_status')) {
                covHistory[item.update.coverage_id].workflow_status = item.update.workflow_status;
            }
        }
    });
    return covHistory;
};

const getDisplayUser = (userId, users) => get(getItemInArrayById(users, userId), 'display_name');

const getHistoryRowElement = (text, historyItem, users) => {
    if (text) {
        return (
            <div>
                <span><strong>{text}</strong>{historyItem.user_id != null ? gettext(' by ') : null}</span>
                <span className="user-name">{self.getDisplayUser(historyItem.user_id, users)}</span>
                <em> <AbsoluteDate date={historyItem._created} /> </em>
            </div>
        );
    }
};

const getPostedHistoryElement = (index, historyItems, users) => {
    let text;
    const historyItem = historyItems[index];
    const itemType = 'event_id' in historyItem ? gettext('Event ') : gettext('Planning ');

    if (historyItem.operation !== HISTORY_OPERATIONS.POST &&
        historyItem.operation !== HISTORY_OPERATIONS.EVENTS_CANCEL &&
        historyItem.operation !== HISTORY_OPERATIONS.PLANNING_CANCEL
    ) {
        return; // not post operation
    }

    text = itemType + gettext('posted');

    if (get(historyItem, 'update.pubstatus') === POST_STATE.CANCELLED) {
        text = itemType + gettext('unposted');
    }

    return self.getHistoryRowElement(text, historyItem, users);
};

// eslint-disable-next-line consistent-this
const self = {
    getDisplayUser,
    getHistoryRowElement,
    getPostedHistoryElement,
    getPlanningItemHistory,
    getGroupedCoverageHistory,
};

export default self;
