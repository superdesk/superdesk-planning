import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {UI} from '../../constants';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {assignmentUtils} from '../../utils';

import {AssignmentItem} from './AssignmentItem';
import {Header, Group} from '../UI/List';
import {OrderDirectionIcon} from '../OrderBar';

class AssignmentGroupListComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {isNextPageLoading: false};
        this.dom = {list: null};

        this.handleScroll = this.handleScroll.bind(this);
        this.changeAssignmentListSingleGroupView = this.changeAssignmentListSingleGroupView.bind(this);
        this.changeListOrder = this.changeListOrder.bind(this);
    }

    componentWillUpdate(nextProps) {
        // Bring scrolltop to top if list settings change
        if (this.props.filterBy !== nextProps.filterBy ||
            this.props.orderByField !== nextProps.orderByField ||
            this.props.orderDirection !== nextProps.orderDirection
        ) {
            if (this.dom.list.scrollTop !== 0) {
                this.dom.list.scrollTop = 0;
            }
        }
    }

    handleScroll(event) {
        if (this.state.isNextPageLoading) {
            return;
        }

        const node = event.target;
        const {totalCount, assignments, loadMoreAssignments, groupKey} = this.props;

        if (node && totalCount > get(assignments, 'length', 0)) {
            if (node.scrollTop + node.offsetHeight + 200 >= node.scrollHeight) {
                this.setState({isNextPageLoading: true});

                loadMoreAssignments(groupKey)
                    .finally(() => this.setState({isNextPageLoading: false}));
            }
        }
    }

    changeAssignmentListSingleGroupView() {
        if (this.props.changeAssignmentListSingleGroupView) {
            this.props.changeAssignmentListSingleGroupView(this.props.groupKey);
        }
    }

    changeListOrder(order) {
        const {changeListSortOrder, groupKey, saveSortPreferences} = this.props;

        changeListSortOrder(groupKey, order, saveSortPreferences);
    }

    getListMaxHeight() {
        if (this.props.assignmentListSingleGroupView) {
            return UI.ASSIGNMENTS.FULL_LIST_NO_OF_ITEMS *
                    UI.ASSIGNMENTS.ITEM_HEIGHT;
        } else {
            return UI.ASSIGNMENTS.DEFAULT_NO_OF_ITEMS * UI.ASSIGNMENTS.ITEM_HEIGHT;
        }
    }

    rowRenderer(index) {
        const {
            users,
            session,
            currentAssignmentId,
            privileges,
            contentTypes,
            desks,
        } = this.props;

        const assignment = this.props.assignments[index];
        const assignedUser = users.find((user) => get(assignment, 'assigned_to.user') === user._id);
        const isCurrentUser = assignedUser && assignedUser._id === session.identity._id;
        const onDoubleClick = assignmentUtils.assignmentHasContent(assignment) ?
            this.props.openArchivePreview.bind(null, assignment) :
            null;

        const assignedDesk = desks.find((desk) => get(assignment, 'assigned_to.desk') === desk._id);

        return (
            <AssignmentItem
                key={assignment._id}
                assignment={assignment}
                onClick={this.props.preview.bind(this, assignment)}
                onDoubleClick={onDoubleClick}
                assignedUser={assignedUser}
                isCurrentUser={isCurrentUser}
                lockedItems={this.props.lockedItems}
                session={session}
                privileges={privileges}
                currentAssignmentId={currentAssignmentId}
                reassign={this.props.reassign}
                completeAssignment={this.props.completeAssignment}
                editAssignmentPriority={this.props.editAssignmentPriority}
                hideItemActions={this.props.hideItemActions}
                startWorking={this.props.startWorking}
                priorities={this.props.priorities}
                removeAssignment={this.props.removeAssignment}
                revertAssignment={this.props.revertAssignment}
                contentTypes={contentTypes}
                assignedDesk={assignedDesk}
            />
        );
    }

    render() {
        const {
            assignments,
            totalCount,
            assignmentListSingleGroupView,
            setMaxHeight,
            groupLabel,
            groupEmptyMessage,
            showCount,
            changeAssignmentListSingleGroupView,
            orderDirection,
        } = this.props;
        const listStyle = setMaxHeight ? {maxHeight: this.getListMaxHeight() + 'px'} : {};

        return (
            <div>
                {!assignmentListSingleGroupView ? (
                    <Header>
                        {changeAssignmentListSingleGroupView ? (
                            <a
                                className="sd-list-header__name sd-list-header__name--cursorPointer"
                                onClick={this.changeAssignmentListSingleGroupView}
                            >
                                <span>{groupLabel}</span>
                            </a>
                        ) : (
                            <span className="sd-list-header__name">{groupLabel}</span>
                        )}

                        {showCount && (
                            <div className="sd-list-header__number sd-flex-grow">
                                <span className="badge">{totalCount}</span>
                            </div>

                        )}

                        <OrderDirectionIcon
                            direction={orderDirection}
                            onChange={this.changeListOrder}
                        />
                    </Header>
                ) : (
                    <Header>
                        <div className="sd-flex-grow sd-list-header__name" />
                        <OrderDirectionIcon
                            direction={orderDirection}
                            onChange={this.changeListOrder}
                        />
                    </Header>
                )}

                <Group
                    verticalScroll={true}
                    shadow={2}
                    style={listStyle}
                    onScroll={this.handleScroll}
                    refNode={(assignmentsList) => this.dom.list = assignmentsList}
                >
                    {get(assignments, 'length', 0) > 0 ? (
                        assignments.map((assignment, index) => this.rowRenderer(index))
                    ) : (
                        <p className="sd-list-item-group__empty-msg">{groupEmptyMessage}</p>
                    )}
                </Group>
            </div>
        );
    }
}

AssignmentGroupListComponent.propTypes = {
    filterBy: PropTypes.string,
    orderByField: PropTypes.string,
    orderDirection: PropTypes.string,
    assignments: PropTypes.array.isRequired,
    groupKey: PropTypes.string.isRequired,
    users: PropTypes.array,
    session: PropTypes.object,
    loadMoreAssignments: PropTypes.func.isRequired,
    lockedItems: PropTypes.object,
    currentAssignmentId: PropTypes.string,
    reassign: PropTypes.func,
    completeAssignment: PropTypes.func,
    editAssignmentPriority: PropTypes.func,
    hideItemActions: PropTypes.bool,
    privileges: PropTypes.object,
    startWorking: PropTypes.func,
    totalCount: PropTypes.number,
    changeAssignmentListSingleGroupView: PropTypes.func,
    assignmentListSingleGroupView: PropTypes.string,
    preview: PropTypes.func,
    priorities: PropTypes.array,
    removeAssignment: PropTypes.func,
    openArchivePreview: PropTypes.func,
    revertAssignment: PropTypes.func,
    setMaxHeight: PropTypes.bool,
    contentTypes: PropTypes.array,
    desks: PropTypes.array,
    groupLabel: PropTypes.string,
    groupStates: PropTypes.arrayOf(PropTypes.string),
    groupEmptyMessage: PropTypes.string,
    showCount: PropTypes.bool,
    changeListSortOrder: PropTypes.func,
    saveSortPreferences: PropTypes.bool,
};

AssignmentGroupListComponent.defaultProps = {
    setMaxHeight: true,
    showCount: true,
    saveSortPreferences: true,
};

const mapStateToProps = (state, ownProps) => {
    const assignmentDataSelector = selectors.getAssignmentGroupSelectors[ownProps.groupKey];

    return {
        filterBy: selectors.getFilterBy(state),
        orderByField: selectors.getOrderByField(state),
        orderDirection: assignmentDataSelector.sortOrder(state),
        assignments: assignmentDataSelector.assignmentsSelector(state),
        totalCount: assignmentDataSelector.countSelector(state),
        previewOpened: selectors.getPreviewAssignmentOpened(state),
        session: selectors.general.session(state),
        users: selectors.general.users(state),
        lockedItems: selectors.locks.getLockedItems(state),
        currentAssignmentId: selectors.getCurrentAssignmentId(state),
        privileges: selectors.general.privileges(state),
        assignmentListSingleGroupView: selectors.getAssignmentListSingleGroupView(state),
        priorities: selectors.getAssignmentPriorities(state),
        desks: selectors.general.desks(state),
    };
};

const mapDispatchToProps = (dispatch) => ({
    preview: (assignment) => dispatch(actions.assignments.ui.preview(assignment)),
    reassign: (assignment) => dispatch(actions.assignments.ui.reassign(assignment)),
    completeAssignment: (assignment) => dispatch(actions.assignments.ui.complete(assignment)),
    revertAssignment: (assignment) => dispatch(actions.assignments.ui.revert(assignment)),
    editAssignmentPriority: (assignment) => dispatch(actions.assignments.ui.editPriority(assignment)),
    startWorking: (assignment) => dispatch(actions.assignments.ui.startWorking(assignment)),
    removeAssignment: (assignment) => dispatch(actions.assignments.ui.showRemoveAssignmentModal(assignment)),
    openArchivePreview: (assignment) => dispatch(actions.assignments.ui.openArchivePreview(assignment)),
    changeListSortOrder: (list, order, savePreference) => (
        dispatch(actions.assignments.ui.changeListSortOrder(list, order, savePreference))
    ),
});

export const AssignmentGroupList = connect(mapStateToProps, mapDispatchToProps)(AssignmentGroupListComponent);
