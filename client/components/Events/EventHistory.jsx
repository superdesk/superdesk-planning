import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import * as selectors from '../../selectors';
import {HISTORY_OPERATIONS} from '../../constants';
import {gettext, historyUtils} from '../../utils';
import {get} from 'lodash';
import {AbsoluteDate} from '../index';
import {ContentBlock} from '../UI/SidePanel';

export class EventHistoryComponent extends React.Component {
    componentWillMount() {
        const {item, fetchEventHistory} = this.props;

        if (get(item, '_id', null) !== null) {
            fetchEventHistory(item._id);
        }
    }

    componentWillReceiveProps(nextProps) {
        const nextId = get(nextProps, 'item._id', null);
        const currentId = get(this.props, 'item._id', null);

        if (nextId !== currentId || get(nextProps, 'historyItems.length') !== get(this.props, 'historyItems.length')) {
            this.props.fetchEventHistory(nextId);
        }
    }

    closeAndOpenDuplicate(duplicateId) {
        this.props.openEventPreview(duplicateId);
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
                    <em><AbsoluteDate
                        date={get(historyItem, 'update._reschedule_from_schedule')}/></em>
                    {gettext(' by ')}
                    <span className="user-name">{historyUtils.getDisplayUser(historyItem.user_id,
                        this.props.users)}</span>
                    <em> <AbsoluteDate date={historyItem._created} /> </em>
                </span>);

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
                                            {historyItem.operation === HISTORY_OPERATIONS.EDITED &&
                                                <div className="more-description">
                                                    {gettext('Updated Fields:')}
                                                    { // List updated fields as comma separated
                                                        <span>&nbsp;{Object.keys(historyItem.update)
                                                            .map((field) => field)
                                                            .join(', ')}</span>
                                                    }
                                                </div>
                                            }
                                            {historyItem.operation === HISTORY_OPERATIONS.PLANNING_CREATED && (
                                                <div className="history-list__link">
                                                    <a onClick={this.props.openPlanningClick.bind(
                                                        null, historyItem.update.planning_id)}>
                                                        View planning item
                                                    </a>
                                                </div>)
                                            }

                                            {historyItem.operation === HISTORY_OPERATIONS.DUPLICATE && (
                                                <div className="history-list__link">
                                                    <a onClick={this.closeAndOpenDuplicate.bind(this,
                                                        historyItem.update.duplicate_id)}>
                                                        View duplicate event
                                                    </a>
                                                </div>
                                            )}
                                            {historyItem.operation === HISTORY_OPERATIONS.DUPLICATE_FROM && (
                                                <div className="history-list__link">
                                                    <a onClick={this.closeAndOpenDuplicate.bind(this,
                                                        historyItem.update.duplicate_id)}>
                                                        View original event
                                                    </a>
                                                </div>
                                            )}

                                            {historyItem.operation === HISTORY_OPERATIONS.RESCHEDULE &&
                                            get(historyItem, 'update.reschedule_to') &&
                                                <div className="history-list__link">
                                                    <a onClick={this.closeAndOpenDuplicate.bind(this,
                                                        historyItem.update.reschedule_to)}>
                                                        View rescheduled event
                                                    </a>
                                                </div>
                                            }

                                            {historyItem.operation === HISTORY_OPERATIONS.RESCHEDULE_FROM &&
                                            get(historyItem, 'update.reschedule_from') &&
                                                <div className="history-list__link">
                                                    <a onClick={this.closeAndOpenDuplicate.bind(this,
                                                        historyItem.update.reschedule_from)}>
                                                        View original event
                                                    </a>
                                                </div>
                                            }
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

EventHistoryComponent.propTypes = {
    item: PropTypes.object,
    users: PropTypes.array,
    historyItems: PropTypes.array,
    fetchEventHistory: PropTypes.func,
    openPlanningClick: PropTypes.func,
    openEventPreview: PropTypes.func,
};

const mapStateToProps = (state, ownProps) => ({
    users: selectors.general.users(state),
    historyItems: selectors.events.eventHistory(state),
});

const mapDispatchToProps = (dispatch) => ({
    fetchEventHistory: (event) => (
        dispatch(actions.events.api.fetchEventHistory(event))
    ),
    openPlanningClick: (planningId) => (
        dispatch(actions.main.openPreview({
            _id: planningId,
            type: 'planning',
        }))
    ),
    openEventPreview: (eventId) => {
        dispatch(actions.main.openPreview({
            _id: eventId,
            type: 'event',
        }));
    },
});

export const EventHistory = connect(mapStateToProps, mapDispatchToProps)(EventHistoryComponent);
