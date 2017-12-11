import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import * as selectors from '../../selectors';
import {getItemInArrayById} from '../../utils';
import {get, includes} from 'lodash';
import {AbsoluteDate} from '../index';

export class EventHistoryComponent extends React.Component {
    componentWillMount() {
        const {item, fetchEventHistory} = this.props;

        if (get(item, '_id', null) !== null) {
            fetchEventHistory(item._id);
        }
    }

    componentWillReceiveProps(nextProps) {
        // If the Assignment item has changed, then load the new history
        const nextId = get(nextProps, 'item._id', null);
        const currentId = get(this.props, 'item._id', null);

        if (nextId !== currentId || get(nextProps, 'historyItems.length') !== get(this.props, 'historyItems.length')) {
            this.props.fetchEventHistory(nextId);
        }
    }

    closeAndOpenDuplicate(duplicateId) {
        // this.props.closeEventHistory();
        this.props.openEventPreview(duplicateId);
    }

    render() {
        const {users} = this.props;
        const displayUser = (recievedUserId) => get(getItemInArrayById(users, recievedUserId), 'display_name');

        return (
            <ul className="history-list history-list--no-padding">
                {get(this.props, 'historyItems', []).map((historyItem) => (
                    <li className="item" key={historyItem._id}>
                        {
                            users &&
                            includes(['create', 'update', 'spiked', 'unspiked',
                                'planning created', 'duplicate', 'duplicate_from',
                                'publish', 'unpublish', 'cancel', 'reschedule',
                                'reschedule_from', 'postpone'], historyItem.operation)
                            &&
                            <div>
                                <strong>
                                    {historyItem.operation === 'create' && 'Created by '}
                                    {historyItem.operation === 'update' && 'Updated by '}
                                    {historyItem.operation === 'spiked' && 'Spiked by '}
                                    {historyItem.operation === 'unspiked' && 'Unspiked by '}
                                    {historyItem.operation === 'planning created' && 'Planning item created by '}
                                    {historyItem.operation === 'duplicate_from' && 'Duplicate created by '}
                                    {historyItem.operation === 'duplicate' && 'Duplicated by '}
                                    {historyItem.operation === 'publish' && 'Published by '}
                                    {historyItem.operation === 'unpublish' && 'Un-published by '}
                                    {historyItem.operation === 'cancel' && 'Cancelled by '}
                                    {historyItem.operation === 'reschedule' && 'Rescheduled by '}
                                    {historyItem.operation === 'reschedule_from' && 'Rescheduled by '}
                                    {historyItem.operation === 'postpone' && 'Postponed by '}
                                </strong>

                                <span className="user-name">{displayUser(historyItem.user_id)}</span>
                                <em> <AbsoluteDate date={historyItem._created} /> </em>
                                <div>
                                    {historyItem.operation === 'update' &&
                                        <div className="more-description">
                                            Updated Fields:
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
                                    get(historyItem, 'update.duplicate_to.length', 0) > 0 &&
                                        <div className="history-list__link">
                                            <a onClick={this.closeAndOpenDuplicate.bind(this,
                                                historyItem.update.duplicate_to.pop())}>
                                                View rescheduled event
                                            </a>
                                        </div>
                                    }

                                    {historyItem.operation === 'reschedule_from' &&
                                    get(historyItem, 'update.duplicate_from') &&
                                        <div className="history-list__link">
                                            <a onClick={this.closeAndOpenDuplicate.bind(this,
                                                historyItem.update.duplicate_from)}>
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
    historyItems: selectors.events.eventPreviewHistory(state),
});

const mapDispatchToProps = (dispatch) => ({
    fetchEventHistory: (event) => (
        dispatch(actions.events.api.fetchEventHistory(event))
    ),
    openPlanningClick: (planningId) => (
        dispatch(actions.planning.ui.previewPlanningAndOpenAgenda(planningId))
    ),
    openEventPreview: (eventId) => {
        dispatch(actions.main.preview({
            _id: eventId,
            _type: 'events',
        }));
    }
});

export const EventHistory = connect(mapStateToProps, mapDispatchToProps)(EventHistoryComponent);
