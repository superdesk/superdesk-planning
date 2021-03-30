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
                <span><strong>{text}</strong>{gettext(' by ')}</span>
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

    for (let i = index - 1; i >= 0; i--) {
        const item = historyItems[i];

        if (item.operation !== HISTORY_OPERATIONS.POST ||
            [HISTORY_OPERATIONS.SPIKED, HISTORY_OPERATIONS.UNSPIKED].includes(historyItem.operation)) {
            continue;
        }

        if (get(item, 'update.pubstatus') === POST_STATE.USABLE) {
            // Current history item happened when the item was in posted state

            if (get(historyItem, 'update.pubstatus') === POST_STATE.USABLE &&
                historyItem.operation !== HISTORY_OPERATIONS.EDITED) {
                // If it is an edit and update operation don't show as a separate item
                return;
            }

            if (get(historyItem, 'update.pubstatus') !== POST_STATE.CANCELLED) {
                text = gettext('Updated');
                break;
            }

            if (get(historyItem, 'update.pubstatus') === POST_STATE.CANCELLED) {
                text = itemType + gettext('unposted');
                break;
            }
        } else if (get(historyItem, 'update.pubstatus') === POST_STATE.USABLE) {
            // Posted when the item was in unposted state
            text = itemType + gettext('re-posted');
            break;
        }
    }

    // Item posted for the first time
    if (!text && historyItem.operation === HISTORY_OPERATIONS.POST) {
        text = itemType + gettext('posted');
    }

    return text && text.includes('unposted') ? (
        <div>
            {self.getHistoryRowElement(gettext('Updated'), historyItem, users)}
            {self.getHistoryRowElement(text, historyItem, users)}
        </div>
    ) : self.getHistoryRowElement(text, historyItem, users);
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
