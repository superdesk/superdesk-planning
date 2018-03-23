import React from 'react';
import PropTypes from 'prop-types';
import {AbsoluteDate} from '../../components';
import {includes, get} from 'lodash';
import './style.scss';

export class EventHistoryList extends React.Component {
    closeAndOpenDuplicate(duplicateId) {
        this.props.closeEventHistory();
        this.props.openEventPreview(duplicateId);
    }

    render() {
        const displayUser = (recievedUserId) => this.props.users.find((u) => (u._id === recievedUserId)).display_name;

        return (
            <div>
                <ul className="history-list">
                    {this.props.eventHistoryItems.map((historyItem) => (
                        <li className="item" key={historyItem._id}>
                            {
                                this.props.users &&
                                includes(['create', 'update', 'spiked', 'unspiked',
                                    'planning created', 'duplicate', 'duplicate_from',
                                    'publish', 'unpublish', 'cancel', 'reschedule',
                                    'reschedule_from', 'postpone', 'ingested'], historyItem.operation)
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
                                        {historyItem.operation === 'ingested' && 'Ingested '}
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
                                                    historyItem.update.duplicate_from)}>
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
            </div>
        );
    }
}

EventHistoryList.propTypes = {
    eventHistoryItems: PropTypes.array.isRequired,
    users: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    openPlanningClick: PropTypes.func,
    openEventPreview: PropTypes.func,
    closeEventHistory: PropTypes.func,
};
