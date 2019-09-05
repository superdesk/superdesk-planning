import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {WORKSPACE, ASSIGNMENTS} from '../../constants';

import {SubNavBar, FiltersBar} from '../../components/Assignments';
import {ArchiveItem} from '../../components/Archive';

export class AssignmentsSubNavComponent extends React.Component {
    constructor(props) {
        super(props);

        this.changeSearchQuery = this.changeSearchQuery.bind(this);
        this.getTotalCountForListGroup = this.getTotalCountForListGroup.bind(this);
        this.changeFilter = this.changeFilter.bind(this);
        this.selectAssignmentsFrom = this.selectAssignmentsFrom.bind(this);
    }

    componentWillMount() {
        this.props.fetchMyAssignmentsCount();
    }

    selectAssignmentsFrom(deskId) {
        const {
            orderByField,
            orderDirection,
        } = this.props;

        if (deskId) {
            this.changeFilter('Desk', orderByField, orderDirection, deskId);
        } else {
            this.changeFilter('User', orderByField, orderDirection, deskId);
        }
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

        loadAssignments({
            filterBy,
            searchQuery,
            orderByField,
            orderDirection,
            filterByType,
            filterByPriority,
            selectedDeskId,
        });

        // Retrieve 'Assigned to me' count based on recent search.
        this.props.fetchMyAssignmentsCount();
    }

    changeFilter(filterBy, orderByField, orderDirection, selectedDeskId = null) {
        const {
            searchQuery,
            loadAssignments,
            filterByType,
            filterByPriority,
        } = this.props;

        loadAssignments({
            filterBy,
            searchQuery,
            orderByField,
            orderDirection,
            filterByType,
            filterByPriority,
            selectedDeskId,
        });
    }

    getTotalCountForListGroup(groupKey) {
        if (!groupKey) {
            return;
        }

        const {assignmentCounts} = this.props;

        return assignmentCounts[groupKey];
    }

    render() {
        const {
            filterBy,
            myAssignmentsCount,
            orderByField,
            orderDirection,
            searchQuery,
            assignmentListSingleGroupView,
            changeAssignmentListSingleGroupView,
            withArchiveItem,
            archiveItem,
            selectedDeskId,
            workspace,
            userDesks,
            currentDeskId,
            showAllDeskOption,
        } = this.props;

        // Show the Desk selection if we're in Fulfil Assignment or Custom Workspace
        const showDeskSelection = workspace === WORKSPACE.AUTHORING ||
            (workspace === WORKSPACE.ASSIGNMENTS && !currentDeskId);

        return (
            <div>
                {withArchiveItem && <ArchiveItem item={archiveItem} />}
                <SubNavBar
                    searchQuery={searchQuery}
                    changeSearchQuery={this.changeSearchQuery}
                    assignmentListSingleGroupView={assignmentListSingleGroupView}
                    changeAssignmentListSingleGroupView={changeAssignmentListSingleGroupView.bind(null, null)}
                    totalCountInListView={this.getTotalCountForListGroup(assignmentListSingleGroupView)}
                />

                <FiltersBar
                    filterBy={filterBy}
                    myAssignmentsCount={myAssignmentsCount}
                    orderByField={orderByField}
                    orderDirection={orderDirection}
                    changeFilter={this.changeFilter}
                    selectedDeskId={selectedDeskId}
                    userDesks={showDeskSelection ? userDesks : []}
                    selectAssignmentsFrom={this.selectAssignmentsFrom}
                    showDeskSelection={showDeskSelection}
                    showAllDeskOption={showAllDeskOption}
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
    currentDeskId: PropTypes.string,
    listGroups: PropTypes.array,
    assignmentCounts: PropTypes.object,
    showAllDeskOption: PropTypes.bool,
};

AssignmentsSubNavComponent.defaultProps = {showAllDeskOption: false};

const mapStateToProps = (state) => ({
    filterBy: selectors.getFilterBy(state),
    selectedDeskId: selectors.getSelectedDeskId(state),
    currentDeskId: selectors.general.currentDeskId(state),
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

    assignmentCounts: selectors.getAssignmentGroupCounts(state),

    userDesks: selectors.general.userDesks(state),
    workspace: selectors.general.currentWorkspace(state),

    listGroups: selectors.getAssignmentGroups(state),
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
    loadAssignments: (filters) => dispatch(actions.assignments.ui.loadAssignments(filters)),
});

export const AssignmentsSubNav = connect(
    mapStateToProps,
    mapDispatchToProps
)(AssignmentsSubNavComponent);
