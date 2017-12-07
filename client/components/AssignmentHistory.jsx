import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, includes, isEqual} from 'lodash';
import {AbsoluteDate} from './index';
import {getItemInArrayById} from '../utils';
import * as actions from '../actions';
import * as selectors from '../selectors';

class AssignmentHistoryComponent extends React.Component {
    componentWillMount() {
        const {assignment, fetchAssignmentHistory} = this.props;

        if (get(assignment, '_id', null) !== null) {
            fetchAssignmentHistory(assignment);
        }
    }

    componentWillReceiveProps(nextProps) {
        // If the Assignment item has changed, then load the new history
        const nextId = get(nextProps, 'assignment._id', null);
        const currentId = get(this.props, 'assignment._id', null);

        // Check if assignment data changed because of any workflow actions
        const nextAssignmentData = get(nextProps, 'assignment.assigned_to');
        const currentAssignmentData = get(this.props, 'assignment.assigned_to');

        if (nextId !== currentId ||
            get(nextProps, 'assignment.priority') !== get(this.props, 'assignment.priority') ||
            !isEqual(nextAssignmentData, currentAssignmentData)) {
            this.props.fetchAssignmentHistory(nextProps.assignment);
        }
    }


    render() {
        const getHistoryActionUserName = (userId) => getItemInArrayById(this.props.users, userId).display_name;

        return (
            <div>
                <ul className="history-list">
                    {this.props.assignmentHistoryItems.map((historyItem) => (
                        <li className="item" key={historyItem._id}>
                            {
                                this.props.users &&
                                includes(['create', 'update', 'unlink', 'start_working', 'complete',
                                    'content_link', 'cancelled', 'submitted', 'spike_unlink'], historyItem.operation)
                                &&
                                <div>
                                    <strong>
                                        {historyItem.operation === 'create' && 'Created by '}
                                        {historyItem.operation === 'update' && 'Updated by '}
                                        {historyItem.operation === 'unlink' && 'Content unlinked by '}
                                        {historyItem.operation === 'content_link' && 'Content linked by '}
                                        {historyItem.operation === 'start_working' && 'Work started by '}
                                        {historyItem.operation === 'complete' && 'Completed by '}
                                        {historyItem.operation === 'submitted' && 'Submitted by '}
                                        {historyItem.operation === 'cancelled' && 'Cancelled by '}
                                        {historyItem.operation === 'spike_unlink' && 'Content Unlinked and Spiked by '}
                                    </strong>

                                    <span className="user-name">{getHistoryActionUserName(historyItem.user_id)}</span>
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

AssignmentHistoryComponent.propTypes = {
    assignment: PropTypes.object,
    fetchAssignmentHistory: PropTypes.func,
    assignmentHistoryItems: PropTypes.array,
    users: PropTypes.array,
};

AssignmentHistoryComponent.defaultProps = {assignmentHistoryItems: []};

const mapStateToProps = (state) => ({
    users: selectors.getUsers(state),
    assignment: selectors.getCurrentAssignment(state),
    assignmentHistoryItems: selectors.getAssignmentHistory(state),
});

const mapDispatchToProps = (dispatch) => (
    {fetchAssignmentHistory: (assignment) => dispatch(actions.assignments.api.fetchAssignmentHistory(assignment))}
);

export const AssignmentHistory = connect(
    mapStateToProps,
    mapDispatchToProps
)(AssignmentHistoryComponent);
