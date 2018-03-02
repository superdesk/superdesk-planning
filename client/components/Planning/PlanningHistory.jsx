import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import * as selectors from '../../selectors';
import {getItemInArrayById, gettext} from '../../utils';
import {get, includes} from 'lodash';
import {AbsoluteDate} from '../index';
import {ContentBlock} from '../UI/SidePanel';

export class PlanningHistoryComponent extends React.Component {
    componentWillMount() {
        const {item, fetchPlanningHistory} = this.props;

        if (get(item, '_id', null) !== null) {
            fetchPlanningHistory(item._id);
        }
    }

    componentWillReceiveProps(nextProps) {
        const nextId = get(nextProps, 'item._id', null);
        const currentId = get(this.props, 'item._id', null);

        if (nextId !== currentId || get(nextProps, 'historyItems.length') !== get(this.props, 'historyItems.length')) {
            this.props.fetchPlanningHistory(nextId);
        }
    }

    closeAndOpenDuplicate(duplicateId) {
        this.props.openPlanningPreview(duplicateId);
    }

    render() {
        const {users, planningHistoryItems} = this.props;
        const displayUser = (recievedUserId) => get(getItemInArrayById(users, recievedUserId), 'display_name');

        return (
            <ContentBlock>
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
                                        {historyItem.operation === 'create' && gettext('Created by ')}
                                        {historyItem.operation === 'update' && gettext('Updated by ')}
                                        {historyItem.operation === 'spiked' && gettext('Spiked by ')}
                                        {historyItem.operation === 'unspiked' && gettext('Unspiked by ')}
                                        {historyItem.operation === 'coverage created' &&
                                            gettext('Coverage created by ')}
                                        {historyItem.operation === 'coverage updated' &&
                                            gettext('Coverage updated by ')}
                                        {historyItem.operation === 'coverage deleted' &&
                                            gettext('Coverage deleted by ')}
                                        {historyItem.operation === 'duplicate_from' && gettext('Duplicate created by ')}
                                        {historyItem.operation === 'duplicate' && gettext('Duplicated by ')}
                                        {historyItem.operation === 'cancel' && gettext('Cancelled by ')}
                                        {historyItem.operation === 'reschedule' && gettext('Rescheduled by ')}
                                        {historyItem.operation === 'postpone' && gettext('Postponed by ')}

                                        {historyItem.operation === 'publish' &&
                                            historyItem.update.state === 'published' &&
                                            gettext('Published by ')
                                        }
                                        {historyItem.operation === 'publish' &&
                                            historyItem.update.state === 'killed' &&
                                            gettext('Killed by ')
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
                                                    {gettext('View duplicate planning item')}
                                                </a>
                                            </div>
                                        )}
                                        {historyItem.operation === 'duplicate_from' && (
                                            <div className="history-list__duplicate">
                                                <a onClick={this.closeAndOpenDuplicate.bind(
                                                    this,
                                                    historyItem.update.duplicate_id
                                                )}>
                                                    {gettext('View original planning item')}
                                                </a>
                                            </div>
                                        )}
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

PlanningHistoryComponent.propTypes = {
    item: PropTypes.object,
    planningHistoryItems: PropTypes.array,
    users: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    currentPlanningId: PropTypes.string,
    fetchPlanningHistory: PropTypes.func,
    closePlanningHistory: PropTypes.func,
    openPlanningPreview: PropTypes.func,
};

const mapStateToProps = (state) => ({
    planningHistoryItems: selectors.getPlanningHistory(state),
    users: selectors.getUsers(state),
});

const mapDispatchToProps = (dispatch) => ({
    fetchPlanningHistory: (currentPlanningId) => (
        dispatch(actions.planning.api.fetchPlanningHistory(currentPlanningId))
    ),
    openPlanningPreview: (planningId) => (
        dispatch(actions.main.openPreview({
            _id: planningId,
            type: 'planning',
        }))
    ),
});

export const PlanningHistory = connect(
    mapStateToProps,
    mapDispatchToProps
)(PlanningHistoryComponent);
