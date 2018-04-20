import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {ASSIGNMENTS} from '../../constants';

import {SubNavBar, FiltersBar} from '../../components/Assignments';
import {ArchiveItem} from '../../components/Archive';

export class AssignmentsSubNavComponent extends React.Component {
    constructor(props) {
        super(props);

        this.changeSearchQuery = this.changeSearchQuery.bind(this);
        this.getTotalCountForListGroup = this.getTotalCountForListGroup.bind(this);
        this.changeFilter = this.changeFilter.bind(this);
    }

    componentWillMount() {
        this.props.fetchMyAssignmentsCount();
    }

    changeSearchQuery(searchQuery) {
        const {
            filterBy,
            orderByField,
            orderDirection,
            loadAssignments,
            filterByType,
            filterByPriority,
        } = this.props;

        Object.keys(ASSIGNMENTS.LIST_GROUPS).forEach((groupKey) =>
            loadAssignments(
                filterBy,
                searchQuery,
                orderByField,
                orderDirection,
                ASSIGNMENTS.LIST_GROUPS[groupKey].states,
                filterByType,
                filterByPriority
            )
        );

        // Retrieve 'Assigned to me' count based on recent search.
        this.props.fetchMyAssignmentsCount();
    }

    changeFilter(filterBy, orderByField, orderDirection) {
        const {searchQuery, loadAssignments, filterByType, filterByPriority} = this.props;

        Object.keys(ASSIGNMENTS.LIST_GROUPS).forEach((groupKey) =>
            loadAssignments(
                filterBy,
                searchQuery,
                orderByField,
                orderDirection,
                ASSIGNMENTS.LIST_GROUPS[groupKey].states,
                filterByType,
                filterByPriority
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
            return this.props.assignmentsInInProressCount;

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
                />
            </div>
        );
    }
}

AssignmentsSubNavComponent.propTypes = {
    filterBy: PropTypes.string,
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
    assignmentsInInProressCount: PropTypes.number,
    assignmentsInCompletedCount: PropTypes.number,
    archiveItem: PropTypes.object,
    withArchiveItem: PropTypes.bool,
};

const mapStateToProps = (state) => ({
    filterBy: selectors.getFilterBy(state),
    myAssignmentsCount: selectors.getMyAssignmentsCount(state),
    orderByField: selectors.getOrderByField(state),
    orderDirection: selectors.getOrderDirection(state),

    searchQuery: selectors.getSearchQuery(state),
    assignmentListSingleGroupView: selectors.getAssignmentListSingleGroupView(state),

    filterByType: selectors.getAssignmentFilterByType(state),
    filterByPriority: selectors.getAssignmentFilterByPriority(state),

    assignmentsInTodoCount: selectors.getAssignmentsToDoListCount(state),
    assignmentsInInProressCount: selectors.getAssignmentsInProgressListCount(state),
    assignmentsInCompletedCount: selectors.getAssignmentsCompletedListCount(state),
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
        filterByPriority
    ) =>
        dispatch(actions.assignments.ui.loadAssignments(
            filterBy, searchQuery, orderByField, orderDirection, filterByState, filterByType, filterByPriority)
        ),
});

export const AssignmentsSubNav = connect(
    mapStateToProps,
    mapDispatchToProps
)(AssignmentsSubNavComponent);
