import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {ASSIGNMENTS} from '../../constants';
import {WORKSPACE} from '../../constants';

import {SubNavBar, FiltersBar} from '../../components/Assignments';
import {ArchiveItem} from '../../components/Archive';

export class AssignmentsSubNavComponent extends React.Component {
    constructor(props) {
        super(props);

        this.changeSearchQuery = this.changeSearchQuery.bind(this);
        this.getTotalCountForListGroup = this.getTotalCountForListGroup.bind(this);
        this.changeFilter = this.changeFilter.bind(this);
        this.selectDesk = this.selectDesk.bind(this);
    }

    componentWillMount() {
        this.props.fetchMyAssignmentsCount();
    }

    selectDesk(deskId) {
        const {
            orderByField,
            orderDirection,
        } = this.props;

        this.changeFilter('Desk', orderByField, orderDirection, deskId);
    }

    changeSearchQuery(searchQuery) {
        const {
            filterBy,
            orderByField,
            orderDirection,
            loadAssignments,
            filterByType,
            filterByPriority,
            selectedDeskId,
        } = this.props;

        Object.keys(ASSIGNMENTS.LIST_GROUPS).forEach((groupKey) =>
            loadAssignments(
                filterBy,
                searchQuery,
                orderByField,
                orderDirection,
                ASSIGNMENTS.LIST_GROUPS[groupKey].states,
                filterByType,
                filterByPriority,
                selectedDeskId
            )
        );

        // Retrieve 'Assigned to me' count based on recent search.
        this.props.fetchMyAssignmentsCount();
    }

    changeFilter(filterBy, orderByField, orderDirection, selectedDeskId = null) {
        const {searchQuery, loadAssignments, filterByType, filterByPriority} = this.props;

        Object.keys(ASSIGNMENTS.LIST_GROUPS).forEach((groupKey) =>
            loadAssignments(
                filterBy,
                searchQuery,
                orderByField,
                orderDirection,
                ASSIGNMENTS.LIST_GROUPS[groupKey].states,
                filterByType,
                filterByPriority,
                selectedDeskId
            )
        );
    }

    getTotalCountForListGroup(groupKey) {
        if (!groupKey) {
            return;
        }

        switch (ASSIGNMENTS.LIST_GROUPS[groupKey].label) {
        case ASSIGNMENTS.LIST_GROUPS.TODO.label:
            return this.props.assignmentsInTodoCount;

        case ASSIGNMENTS.LIST_GROUPS.IN_PROGRESS.label:
            return this.props.assignmentsInInProgressCount;

        case ASSIGNMENTS.LIST_GROUPS.COMPLETED.label:
            return this.props.assignmentsInCompletedCount;
        }
    }

    render() {
        const {
            filterBy,
            myAssignmentsCount,
            orderByField,
            orderDirection,
            searchQuery,
            onlyTodoAssignments,
            assignmentListSingleGroupView,
            changeAssignmentListSingleGroupView,
            withArchiveItem,
            archiveItem,
            selectedDeskId,
            workspace,
            userDesks,
        } = this.props;

        return (
            <div>
                {withArchiveItem && <ArchiveItem item={archiveItem} />}
                <SubNavBar
                    searchQuery={searchQuery}
                    changeSearchQuery={this.changeSearchQuery}
                    assignmentListSingleGroupView={onlyTodoAssignments ? 'TODO' : assignmentListSingleGroupView}
                    changeAssignmentListSingleGroupView={changeAssignmentListSingleGroupView.bind(null, null)}
                    totalCountInListView={this.getTotalCountForListGroup(assignmentListSingleGroupView)}
                    onlyTodoAssignments={onlyTodoAssignments}
                />

                <FiltersBar
                    filterBy={filterBy}
                    myAssignmentsCount={myAssignmentsCount}
                    orderByField={orderByField}
                    orderDirection={orderDirection}
                    changeFilter={this.changeFilter}
                    selectedDeskId={selectedDeskId}
                    userDesks={workspace === WORKSPACE.AUTHORING ? userDesks : []}
                    selectDesk={this.selectDesk}
                />
            </div>
        );
    }
}

AssignmentsSubNavComponent.propTypes = {
    filterBy: PropTypes.string,
    selectedDeskId: PropTypes.string,
    myAssignmentsCount: PropTypes.number,
    orderByField: PropTypes.string,
    orderDirection: PropTypes.string,
    fetchMyAssignmentsCount: PropTypes.func,
    searchQuery: PropTypes.string,
    onlyTodoAssignments: PropTypes.bool,
    assignmentListSingleGroupView: PropTypes.string,
    changeAssignmentListSingleGroupView: PropTypes.func,
    loadAssignments: PropTypes.func.isRequired,
    filterByType: PropTypes.string,
    filterByPriority: PropTypes.string,
    assignmentsInTodoCount: PropTypes.number,
    assignmentsInInProgressCount: PropTypes.number,
    assignmentsInCompletedCount: PropTypes.number,
    archiveItem: PropTypes.object,
    withArchiveItem: PropTypes.bool,
    userDesks: PropTypes.array,
    workspace: PropTypes.string,
};

const mapStateToProps = (state) => ({
    filterBy: selectors.getFilterBy(state),
    selectedDeskId: selectors.getSelectedDeskId(state),
    myAssignmentsCount: selectors.getMyAssignmentsCount(state),
    orderByField: selectors.getOrderByField(state),
    orderDirection: selectors.getOrderDirection(state),

    searchQuery: selectors.getSearchQuery(state),
    assignmentListSingleGroupView: selectors.getAssignmentListSingleGroupView(state),

    filterByType: selectors.getAssignmentFilterByType(state),
    filterByPriority: selectors.getAssignmentFilterByPriority(state),

    assignmentsInTodoCount: selectors.getAssignmentsToDoListCount(state),
    assignmentsInInProgressCount: selectors.getAssignmentsInProgressListCount(state),
    assignmentsInCompletedCount: selectors.getAssignmentsCompletedListCount(state),
    userDesks: selectors.general.userDesks(state),
    workspace: selectors.general.currentWorkspace(state),
});

const mapDispatchToProps = (dispatch) => ({
    changeAssignmentListSingleGroupView: (groupKey) => dispatch(
        actions.assignments.ui.changeAssignmentListSingleGroupView(groupKey)
    ),
    fetchMyAssignmentsCount: () => dispatch(
        actions.assignments.ui.queryAndGetMyAssignments(
            [ASSIGNMENTS.WORKFLOW_STATE.ASSIGNED, ASSIGNMENTS.WORKFLOW_STATE.SUBMITTED]
        )
    ),
    loadAssignments: (
        filterBy,
        searchQuery,
        orderByField,
        orderDirection,
        filterByState,
        filterByType,
        filterByPriority,
        selectedDeskId
    ) =>
        dispatch(actions.assignments.ui.loadAssignments(
            filterBy, searchQuery, orderByField,
            orderDirection, filterByState, filterByType, filterByPriority, selectedDeskId
        )
        ),
});

export const AssignmentsSubNav = connect(
    mapStateToProps,
    mapDispatchToProps
)(AssignmentsSubNavComponent);
