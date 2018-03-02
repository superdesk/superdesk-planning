import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import * as selectors from '../../selectors';
import {getItemInArrayById, gettext} from '../../utils';
import {get, includes} from 'lodash';
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

    render() {
        const {users} = this.props;
        const displayUser = (recievedUserId) => get(getItemInArrayById(users, recievedUserId), 'display_name');

        return (
            <ContentBlock>
                <ul className="history-list history-list--no-padding">
                    {get(this.props, 'historyItems', []).map((historyItem) => (
                        <li className="item" key={historyItem._id}>
                            {
                                users &&
                                includes(['create', 'update', 'spiked', 'unspiked',
                                    'planning created', 'duplicate', 'duplicate_from',
                                    'publish', 'unpublish', 'cancel', 'reschedule',
                                    'reschedule_from', 'postpone', 'ingested', 'update_repetitions'],
                                historyItem.operation)
                                &&
                                <div>
                                    <strong>
                                        {historyItem.operation === 'create' && gettext('Created by ')}
                                        {historyItem.operation === 'update' && gettext('Updated by ')}
                                        {historyItem.operation === 'spiked' && gettext('Spiked by ')}
                                        {historyItem.operation === 'unspiked' && gettext('Unspiked by ')}
                                        {historyItem.operation === 'planning created' &&
                                            gettext('Planning item created by ')}
                                        {historyItem.operation === 'duplicate_from' && gettext('Duplicate created by ')}
                                        {historyItem.operation === 'duplicate' && gettext('Duplicated by ')}
                                        {historyItem.operation === 'publish' && gettext('Published by ')}
                                        {historyItem.operation === 'unpublish' && gettext('Un-published by ')}
                                        {historyItem.operation === 'cancel' && gettext('Cancelled by ')}
                                        {historyItem.operation === 'reschedule' && gettext('Rescheduled by ')}
                                        {historyItem.operation === 'reschedule_from' && gettext('Rescheduled by ')}
                                        {historyItem.operation === 'postpone' && gettext('Postponed by ')}
                                        {historyItem.operation === 'ingested' && gettext('Ingested ')}
                                        {historyItem.operation === 'update_repetitions' &&
                                            gettext('Repetitions Updated ')}
                                    </strong>

                                    <span className="user-name">{displayUser(historyItem.user_id)}</span>
                                    <em> <AbsoluteDate date={historyItem._created} /> </em>
                                    <div>
                                        {historyItem.operation === 'update' &&
                                            <div className="more-description">
                                                {gettext('Updated Fields:')}
                                                { // List updated fields as comma separated
                                                    <span>&nbsp;{Object.keys(historyItem.update).map((field) => field)
                                                        .join(', ')}</span>
                                                }
                                            </div>
                                        }
                                        {historyItem.operation === 'planning created' && (
                                            <div className="history-list__link">
                                                <a onClick={this.props.openPlanningClick.bind(
                                                    null, historyItem.update.planning_id)}>
                                                    View planning item
                                                </a>
                                            </div>)
                                        }
                                        {historyItem.operation === 'duplicate' && (
                                            <div className="history-list__link">
                                                <a onClick={this.closeAndOpenDuplicate.bind(this,
                                                    historyItem.update.duplicate_id)}>
                                                    View duplicate event
                                                </a>
                                            </div>
                                        )}
                                        {historyItem.operation === 'duplicate_from' && (
                                            <div className="history-list__link">
                                                <a onClick={this.closeAndOpenDuplicate.bind(this,
                                                    historyItem.update.duplicate_id)}>
                                                    View original event
                                                </a>
                                            </div>
                                        )}

                                        {historyItem.operation === 'reschedule' &&
                                        get(historyItem, 'update.reschedule_to') &&
                                            <div className="history-list__link">
                                                <a onClick={this.closeAndOpenDuplicate.bind(this,
                                                    historyItem.update.reschedule_to)}>
                                                    View rescheduled event
                                                </a>
                                            </div>
                                        }

                                        {historyItem.operation === 'reschedule_from' &&
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
                            }
                        </li>
                    ))}
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
    users: selectors.getUsers(state),
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
    }
});

export const EventHistory = connect(mapStateToProps, mapDispatchToProps)(EventHistoryComponent);
