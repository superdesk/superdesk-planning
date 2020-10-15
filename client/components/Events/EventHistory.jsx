import React from 'react';
import PropTypes from 'prop-types';
import {HISTORY_OPERATIONS, ITEM_TYPE} from '../../constants';
import {gettext, historyUtils} from '../../utils';
import {get} from 'lodash';
import {AbsoluteDate} from '../index';
import {ContentBlock} from '../UI/SidePanel';

export class EventHistory extends React.Component {
    closeAndOpenDuplicate(duplicateId) {
        this.props.openItemPreview(duplicateId, ITEM_TYPE.EVENT);
    }

    getHistoryActionElement(historyItem) {
        let text;

        switch (historyItem.operation) {
        case HISTORY_OPERATIONS.INGESTED:
            text = gettext('Ingested');
            break;

        case HISTORY_OPERATIONS.CREATE:
            text = gettext('Created');
            break;

        case HISTORY_OPERATIONS.EDITED:
            text = gettext('Edited');
            break;

        case HISTORY_OPERATIONS.SPIKED:
            text = gettext('Event spiked');
            break;

        case HISTORY_OPERATIONS.UNSPIKED:
            text = gettext('Event unspiked');
            break;

        case HISTORY_OPERATIONS.RESCHEDULE:
            text = gettext('Event Rescheduled');
            break;

        case HISTORY_OPERATIONS.EVENTS_CANCEL:
            text = gettext('Event Cancelled');
            break;

        case HISTORY_OPERATIONS.POSTPONE:
            text = gettext('Event Postponed');
            break;

        case HISTORY_OPERATIONS.RESCHEDULE_FROM:
            text = gettext('Event Rescheduled from');
            return (
                <span>
                    <strong>{text}</strong>
                    <em>
                        <AbsoluteDate
                            date={get(historyItem, 'update._reschedule_from_schedule')}
                        />
                    </em>
                    {gettext(' by ')}
                    <span className="user-name">
                        {historyUtils.getDisplayUser(
                            historyItem.user_id,
                            this.props.users
                        )}
                    </span>
                    <em> <AbsoluteDate date={historyItem._created} /> </em>
                </span>
            );

        case HISTORY_OPERATIONS.PLANNING_CREATED:
            text = gettext('Planning item created');
            break;

        case HISTORY_OPERATIONS.UPDATE_TIME:
            text = gettext('Event time modified');
            break;

        case HISTORY_OPERATIONS.CONVERT_RECURRING:
            text = gettext('Converted to recurring event');
            break;

        case HISTORY_OPERATIONS.UPDATE_REPETITIONS:
            text = gettext('Event repetitions modified');
            break;

        case HISTORY_OPERATIONS.UPDATE_REPETITIONS_UPDATE:
            text = gettext('Repetitions updated');
            break;

        case HISTORY_OPERATIONS.UPDATE_REPETITIONS_CREATE:
            text = gettext('Created from \'update repetitions\'');
            break;

        case HISTORY_OPERATIONS.DUPLICATE_FROM:
            text = gettext('Duplicate created');
            break;

        case HISTORY_OPERATIONS.DUPLICATE:
            text = gettext('Duplicated');
            break;

        case HISTORY_OPERATIONS.CREATED_FROM_PLANNING:
            text = gettext('Created from a planning item');
            break;
        }

        return historyUtils.getHistoryRowElement(text, historyItem, this.props.users);
    }

    render() {
        return (
            <ContentBlock>
                <ul className="history-list history-list--no-padding">
                    {get(this.props, 'historyItems', []).map((historyItem, index) => {
                        const postElement = historyUtils.getPostedHistoryElement(
                            index, this.props.historyItems, this.props.users);
                        const historyElement = this.getHistoryActionElement(historyItem);

                        if (postElement || historyElement) {
                            return (
                                <li className="item" key={historyItem._id}>
                                    <div>
                                        {postElement}
                                        {historyElement}
                                        <div>
                                            {historyItem.operation === HISTORY_OPERATIONS.EDITED && (
                                                <div className="more-description">
                                                    {gettext('Updated Fields:')}
                                                    { // List updated fields as comma separated
                                                        <span>&nbsp;{Object.keys(historyItem.update)
                                                            .map((field) => field)
                                                            .join(', ')}</span>
                                                    }
                                                </div>
                                            )}
                                            {historyItem.operation === HISTORY_OPERATIONS.PLANNING_CREATED && (
                                                <div className="history-list__link">
                                                    <a
                                                        onClick={this.props.openItemPreview.bind(
                                                            null, historyItem.update.planning_id, ITEM_TYPE.PLANNING)}
                                                    >
                                                        {gettext('View planning item')}
                                                    </a>
                                                </div>
                                            )
                                            }

                                            {historyItem.operation === HISTORY_OPERATIONS.DUPLICATE && (
                                                <div className="history-list__link">
                                                    <a
                                                        onClick={this.closeAndOpenDuplicate.bind(this,
                                                            historyItem.update.duplicate_id)}
                                                    >
                                                        {gettext('View duplicate event')}
                                                    </a>
                                                </div>
                                            )}
                                            {historyItem.operation === HISTORY_OPERATIONS.DUPLICATE_FROM && (
                                                <div className="history-list__link">
                                                    <a
                                                        onClick={this.closeAndOpenDuplicate.bind(this,
                                                            historyItem.update.duplicate_id)}
                                                    >
                                                        {gettext('View original event')}
                                                    </a>
                                                </div>
                                            )}

                                            {historyItem.operation === HISTORY_OPERATIONS.RESCHEDULE &&
                                            get(historyItem, 'update.reschedule_to') && (
                                                <div className="history-list__link">
                                                    <a
                                                        onClick={this.closeAndOpenDuplicate.bind(this,
                                                            historyItem.update.reschedule_to)}
                                                    >
                                                        {gettext('View rescheduled event')}
                                                    </a>
                                                </div>
                                            )}

                                            {historyItem.operation === HISTORY_OPERATIONS.RESCHEDULE_FROM &&
                                            get(historyItem, 'update.reschedule_from') && (
                                                <div className="history-list__link">
                                                    <a
                                                        onClick={this.closeAndOpenDuplicate.bind(this,
                                                            historyItem.update.reschedule_from)}
                                                    >
                                                        {gettext('View original event')}
                                                    </a>
                                                </div>
                                            )}

                                            {historyItem.operation === HISTORY_OPERATIONS.CREATED_FROM_PLANNING &&
                                            get(historyItem, 'update.created_from_planning') && (
                                                <div className="history-list__link">
                                                    <a
                                                        onClick={this.props.openItemPreview.bind(
                                                            this,
                                                            historyItem.update.created_from_planning,
                                                            ITEM_TYPE.PLANNING
                                                        )}
                                                    >
                                                        {gettext('View planning item')}
                                                    </a>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                </li>
                            );
                        }

                        return null;
                    })}
                </ul>
            </ContentBlock>
        );
    }
}

EventHistory.propTypes = {
    historyItems: PropTypes.array,
    users: PropTypes.array,
    openItemPreview: PropTypes.func,
};
