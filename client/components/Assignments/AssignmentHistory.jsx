import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, isEqual} from 'lodash';

import {getItemInArrayById, gettext} from '../../utils';
import * as actions from '../../actions';
import * as selectors from '../../selectors';
import {ASSIGNMENTS} from '../../constants';

import {AbsoluteDate} from '../';
import {ContentBlock} from '../UI/SidePanel';

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

    transcribedHistoryAction(item) {
        const {operation, update} = item;
        let desk, user, prefix;
        const suffix = operation === ASSIGNMENTS.HISTORY_OPERATIONS.CREATE ? gettext(' created by ') :
            gettext(' by ');

        switch (operation) {
        case ASSIGNMENTS.HISTORY_OPERATIONS.CREATE:
        case ASSIGNMENTS.HISTORY_OPERATIONS.REASSIGNED:
            desk = getItemInArrayById(this.props.desks, get(update, 'assigned_to.desk'));
            user = getItemInArrayById(this.props.users, get(update, 'assigned_to.user'));
            prefix = operation === ASSIGNMENTS.HISTORY_OPERATIONS.CREATE ? gettext('Assignment for ') :
                gettext('Coverage re-assigned to ');

            if (user) {
                return (
                    <span>{prefix}<strong>{desk.name}</strong>
                        {gettext(' and ')}<strong>{user.display_name}</strong>{suffix}</span>
                );
            } else {
                return (<span>{prefix}<strong>{desk.name}</strong>{suffix}</span>);
            }

        case ASSIGNMENTS.HISTORY_OPERATIONS.EDIT_PRIORITY:
            return (<span>{gettext('Priority modified to ')}<strong>{get(update, 'priority')}</strong>{suffix}</span>);

        case ASSIGNMENTS.HISTORY_OPERATIONS.COMPLETE:
            return (<span><strong>{gettext('Completed ')}</strong>{suffix}</span>);

        case ASSIGNMENTS.HISTORY_OPERATIONS.CONFIRM:
            return (<span>{gettext('Coverage availability ')}<strong>{gettext(' confirmed ')}</strong>{suffix}</span>);

        case ASSIGNMENTS.HISTORY_OPERATIONS.REVERT:
            return (<span>{gettext('Coverage availability ')}<strong>{gettext(' reverted ')}</strong>{suffix}</span>);

        case ASSIGNMENTS.HISTORY_OPERATIONS.CONTENT_LINK:
            return (<span><strong>{gettext('Content linked ')}</strong>{gettext('to coverage assignment by ')}</span>);

        case ASSIGNMENTS.HISTORY_OPERATIONS.ADD_TO_WORKFLOW:
            return (<span>{gettext('Assignment ')}<strong>{gettext('added to workflow')}</strong>{suffix}</span>);

        case ASSIGNMENTS.HISTORY_OPERATIONS.SUBMITTED:
            desk = getItemInArrayById(this.props.desks, get(update, 'assigned_to.desk'));
            return (
                <span>{gettext('Assignment ')}<strong>{gettext('submitted')}</strong>
                    {gettext(' to ')}<strong>{desk.name}</strong>{suffix}</span>
            );

        case ASSIGNMENTS.HISTORY_OPERATIONS.CANCELLED:
            return (<span>{gettext('Coverage ')}<strong>{gettext('cancelled')}</strong>{suffix}</span>);

        case ASSIGNMENTS.HISTORY_OPERATIONS.SPIKE_UNLINK:
            return (<span>{gettext('Content ')}<strong>{gettext('spiked and unlinked')}</strong>{suffix}</span>);

        case ASSIGNMENTS.HISTORY_OPERATIONS.UNLINK:
            return (
                <span><strong>{gettext('Content unlinked ')}</strong>{gettext('from coverage assignment by ')}
                </span>
            );

        case ASSIGNMENTS.HISTORY_OPERATIONS.START_WORKING:
            return (<span><strong>{gettext('Work started ')}</strong>{gettext('on assignment by ')}</span>);

        case ASSIGNMENTS.HISTORY_OPERATIONS.ASSIGNMENT_ACCEPTED:
            return (<span>{gettext('The assignment has been accepted ')}</span>);

        default:
            return null;
        }
    }

    render() {
        const getHistoryActionUserName = (userId) => getItemInArrayById(this.props.users, userId).display_name;

        return (
            <ContentBlock>
                <ul className="history-list">
                    {this.props.assignmentHistoryItems.map((historyItem) => (
                        <li className="item" key={historyItem._id}>
                            <div>
                                {this.transcribedHistoryAction(historyItem)}
                                <span className="user-name">{getHistoryActionUserName(historyItem.user_id)}</span>
                                <em> <AbsoluteDate date={historyItem._created} /> </em>
                            </div>
                        </li>
                    ))}
                </ul>
            </ContentBlock>
        );
    }
}

AssignmentHistoryComponent.propTypes = {
    assignment: PropTypes.object,
    fetchAssignmentHistory: PropTypes.func,
    assignmentHistoryItems: PropTypes.array,
    users: PropTypes.array,
    desks: PropTypes.array,
};

AssignmentHistoryComponent.defaultProps = {assignmentHistoryItems: []};

const mapStateToProps = (state) => ({
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
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
