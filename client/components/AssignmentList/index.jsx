import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';
import {AssignmentItem} from '../index';
import {ASSIGNMENTS, UI, WORKSPACE} from '../../constants';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {assignmentUtils} from '../../utils';
import './style.scss';

class AssignmentListComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {isNextPageLoading: false};
        this.assignmentsList = null;
    }

    componentWillUpdate(nextProps) {
        // Bring scrolltop to top if list settings change
        if (this.props.filterBy !== nextProps.filterBy ||
            this.props.orderByField !== nextProps.orderByField ||
            this.props.orderDirection !== nextProps.orderDirection
        ) {
            if (this.assignmentsList.scrollTop !== 0) {
                this.assignmentsList.scrollTop = 0;
            }
        }
    }

    componentWillMount() {
        this.props.loadAssignmentsForGroup(this.props.groupKey);
    }

    handleScroll(event) {
        if (this.state.isNextPageLoading) {
            return;
        }

        const node = event.target;

        if (node && this.props.totalCount > this.props.assignments.length) {
            if (node.scrollTop + node.offsetHeight + 200 >= node.scrollHeight) {
                this.setState({isNextPageLoading: true});

                this.props.loadMoreAssignments(
                    ASSIGNMENTS.LIST_GROUPS[this.props.groupKey].states)
                    .finally(() => {
                        this.setState({isNextPageLoading: false});
                    });
            }
        }
    }

    getListMaxHeight() {
        if (this.props.assignmentListSingleGroupView) {
            return UI.ASSIGNMENTS.FULL_LIST_NO_OF_ITEMS *
                    UI.ASSIGNMENTS.ITEM_HEIGHT;
        } else {
            return UI.ASSIGNMENTS.DEFAULT_NO_OF_ITEMS * UI.ASSIGNMENTS.ITEM_HEIGHT;
        }
    }

    rowRenderer({index}) {
        const assignment = this.props.assignments[index];
        const {users, session, currentAssignmentId, privileges} = this.props;
        const assignedUser = users.find((user) => get(assignment, 'assigned_to.user') === user._id);
        const isCurrentUser = assignedUser && assignedUser._id === session.identity._id;
        const onDoubleClick = assignmentUtils.assignmentHasContent(assignment) ?
            this.props.openArchivePreview.bind(null, assignment) :
            null;

        return (
            <AssignmentItem
                key={assignment._id}
                className="assignments-list__item"
                assignment={assignment}
                isSelected={this.props.selectedAssignments.indexOf(assignment._id) > -1}
                onClick={this.props.preview.bind(this, assignment)}
                onDoubleClick={onDoubleClick}
                onSelectChange={(value) => this.props.onAssignmentSelectChange({
                    assignment: assignment._id,
                    value: value,
                })}
                assignedUser={assignedUser}
                isCurrentUser={isCurrentUser}
                lockedItems={this.props.lockedItems}
                session={session}
                privileges={privileges}
                currentAssignmentId={currentAssignmentId}
                reassign={this.props.reassign}
                completeAssignment={this.props.completeAssignment}
                editAssignmentPriority={this.props.editAssignmentPriority}
                inAssignments={this.props.inAssignments}
                startWorking={this.props.startWorking}
                priorities={this.props.priorities}
                removeAssignment={this.props.removeAssignment}
                revertAssignment={this.props.revertAssignment}
            />
        );
    }

    render() {
        const {
            assignments,
            groupKey,
            totalCount,
            changeAssignmentListSingleGroupView,
            assignmentListSingleGroupView,
            inAuthoring,
        } = this.props;
        const listStyle = inAuthoring ?
            {} :
            {maxHeight: this.getListMaxHeight() + 'px'};

        return (
            <div className="assignments-list">
                {!assignmentListSingleGroupView && (<div className="assignments-list__title">
                    <a onClick={changeAssignmentListSingleGroupView.bind(this, groupKey)}>
                        {ASSIGNMENTS.LIST_GROUPS[groupKey].label}</a>
                    <span className="badge">{totalCount}</span>
                </div>)}
                <div className="assignments-list__items" style={listStyle}
                    onScroll={this.handleScroll.bind(this)}
                    ref={(assignmentsList) => this.assignmentsList = assignmentsList}
                >
                    {assignments.map((assignment, index) => {
                        const input = {
                            index: index,
                            key: assignment._id,
                        };

                        return this.rowRenderer(input);
                    })}
                    { !assignments || assignments.length === 0 &&
                        <p className="assignments-list__empty-msg">There is no assignment yet</p>
                    }
                </div>
            </div>
        );
    }
}

AssignmentListComponent.propTypes = {
    filterBy: PropTypes.string,
    orderByField: PropTypes.string,
    orderDirection: PropTypes.string,
    assignments: PropTypes.array.isRequired,
    groupKey: PropTypes.string.isRequired,
    users: PropTypes.array,
    session: PropTypes.object,
    selectedAssignments: PropTypes.array.isRequired,
    loadMoreAssignments: PropTypes.func.isRequired,
    loadAssignmentsForGroup: PropTypes.func.isRequired,
    lockedItems: PropTypes.object,
    currentAssignmentId: PropTypes.string,
    reassign: PropTypes.func,
    completeAssignment: PropTypes.func,
    editAssignmentPriority: PropTypes.func,
    inAssignments: PropTypes.bool,
    privileges: PropTypes.object,
    startWorking: PropTypes.func,
    totalCount: PropTypes.number,
    changeAssignmentListSingleGroupView: PropTypes.func,
    assignmentListSingleGroupView: PropTypes.string,
    preview: PropTypes.func,
    onAssignmentSelectChange: PropTypes.func.isRequired,
    priorities: PropTypes.array,
    removeAssignment: PropTypes.func,
    openArchivePreview: PropTypes.func,
    revertAssignment: PropTypes.func,
    inAuthoring: PropTypes.bool,
};

AssignmentListComponent.defaultProps = {inAuthoring: false};

const getAssignmentsSelectorsForListGroup = (groupKey) => {
    const groupLabel = ASSIGNMENTS.LIST_GROUPS[groupKey].label;

    switch (groupLabel) {
    case ASSIGNMENTS.LIST_GROUPS.TODO.label:
        return {
            assignmentsSelector: (state) => (selectors.getTodoAssignments(state)),
            countSelector: (state) => (selectors.getAssignmentsToDoListCount(state)),
        };

    case ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.label:
        return {
            assignmentsSelector: (state) => (selectors.getInProgressAssignments(state)),
            countSelector: (state) => (selectors.getAssignmentsInProgressListCount(state)),
        };

    default:
        return {
            assignmentsSelector: (state) => (selectors.getCompletedAssignments(state)),
            countSelector: (state) => (selectors.getAssignmentsCompletedListCount(state)),
        };
    }
};

const mapStateToProps = (state, ownProps) => {
    const assignmentDataSelector = getAssignmentsSelectorsForListGroup(ownProps.groupKey);

    return {
        filterBy: selectors.getFilterBy(state),
        orderByField: selectors.getOrderByField(state),
        orderDirection: selectors.getOrderDirection(state),
        assignments: assignmentDataSelector.assignmentsSelector(state),
        totalCount: assignmentDataSelector.countSelector(state),
        selectedAssignments: selectors.getSelectedAssignments(state),
        previewOpened: selectors.getPreviewAssignmentOpened(state),
        session: selectors.getSessionDetails(state),
        users: selectors.getUsers(state),
        lockedItems: selectors.locks.getLockedItems(state),
        currentAssignmentId: selectors.getCurrentAssignmentId(state),
        inAssignments: selectors.getCurrentWorkspace(state) === WORKSPACE.ASSIGNMENTS,
        privileges: selectors.getPrivileges(state),
        assignmentListSingleGroupView: selectors.getAssignmentListSingleGroupView(state),
        priorities: selectors.getAssignmentPriorities(state),
    };
};

const mapDispatchToProps = (dispatch) => ({
    preview: (assignment) => dispatch(actions.assignments.ui.preview(assignment)),
    onAssignmentSelectChange: (value) => dispatch(actions.assignments.ui.toggleAssignmentSelection(value)),
    reassign: (assignment) => dispatch(actions.assignments.ui.reassign(assignment)),
    completeAssignment: (assignment) => dispatch(actions.assignments.ui.complete(assignment)),
    revertAssignment: (assignment) => dispatch(actions.assignments.ui.revert(assignment)),
    editAssignmentPriority: (assignment) => dispatch(actions.assignments.ui.editPriority(assignment)),
    startWorking: (assignment) => dispatch(actions.assignments.ui.openSelectTemplateModal(assignment)),
    removeAssignment: (assignment) => dispatch(actions.assignments.ui.showRemoveAssignmentModal(assignment)),
    openArchivePreview: (assignment) => dispatch(actions.assignments.ui.openArchivePreview(assignment)),
});

export const AssignmentList = connect(mapStateToProps, mapDispatchToProps)(AssignmentListComponent);
