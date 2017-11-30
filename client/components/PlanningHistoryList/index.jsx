import React from 'react';
import PropTypes from 'prop-types';
import {AbsoluteDate} from '../../components';
import {includes} from 'lodash';
import './style.scss';

export class PlanningHistoryList extends React.Component {
    closeAndOpenDuplicate(duplicateId) {
        this.props.closePlanningHistory();
        this.props.openPlanningPreview(duplicateId);
    }

    render() {
        const {planningHistoryItems, users} = this.props;

        const displayUser = (recievedUserId) => users.find((u) => (u._id === recievedUserId)).display_name;

        return (
            <div>
                <ul className="history-list">
                    {planningHistoryItems.map((historyItem) => (
                        <li className="item" key={historyItem._id}>
                            {
                                users &&
                                includes(['create', 'update', 'spiked', 'unspiked', 'coverage created',
                                    'coverage updated', 'coverage deleted', 'publish', 'duplicate',
                                    'duplicate_from', 'cancel', 'reschedule',
                                    'postpone'], historyItem.operation)
                                &&
                                <div>
                                    <strong>
                                        {historyItem.operation === 'create' && 'Created by '}
                                        {historyItem.operation === 'update' && 'Updated by '}
                                        {historyItem.operation === 'spiked' && 'Spiked by '}
                                        {historyItem.operation === 'unspiked' && 'Unspiked by '}
                                        {historyItem.operation === 'coverage created' && 'Coverage created by '}
                                        {historyItem.operation === 'coverage updated' && 'Coverage updated by '}
                                        {historyItem.operation === 'coverage deleted' && 'Coverage deleted by '}
                                        {historyItem.operation === 'duplicate_from' && 'Duplicate created by '}
                                        {historyItem.operation === 'duplicate' && 'Duplicated by '}
                                        {historyItem.operation === 'cancel' && 'Cancelled by '}
                                        {historyItem.operation === 'reschedule' && 'Rescheduled by '}
                                        {historyItem.operation === 'postpone' && 'Postponed by '}

                                        {historyItem.operation === 'publish' &&
                                            historyItem.update.state === 'published' &&
                                            'Published by '
                                        }
                                        {historyItem.operation === 'publish' &&
                                            historyItem.update.state === 'killed' &&
                                            'Killed by '
                                        }
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
                                        {historyItem.operation === 'duplicate' && (
                                            <div className="history-list__duplicate">
                                                <a onClick={this.closeAndOpenDuplicate.bind(
                                                    this,
                                                    historyItem.update.duplicate_id
                                                )}>
                                                    View duplicate event
                                                </a>
                                            </div>
                                        )}
                                        {historyItem.operation === 'duplicate_from' && (
                                            <div className="history-list__duplicate">
                                                <a onClick={this.closeAndOpenDuplicate.bind(
                                                    this,
                                                    historyItem.update.duplicate_id
                                                )}>
                                                    View original event
                                                </a>
                                            </div>
                                        )}
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

PlanningHistoryList.propTypes = {
    planningHistoryItems: PropTypes.array.isRequired,
    users: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    closePlanningHistory: PropTypes.func,
    openPlanningPreview: PropTypes.func,
};
