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
        this.changeSortField = this.changeSortField.bind(this);
    }

    componentWillMount() {
        this.props.fetchMyAssignmentsCount();
    }

    selectAssignmentsFrom(deskId) {
        const {
            orderByField,
        } = this.props;

        if (deskId) {
            this.changeFilter('Desk', orderByField, deskId);
        } else {
            this.changeFilter('User', orderByField, deskId);
        }
    }

    changeSearchQuery(searchQuery) {
        const {
            filterBy,
            orderByField,
            loadAssignments,
            filterByType,
            filterByPriority,
            selectedDeskId,
            ignoreScheduledUpdates,
        } = this.props;

        loadAssignments({
            filterBy,
            searchQuery,
            orderByField,
            filterByType,
            filterByPriority,
            selectedDeskId,
            ignoreScheduledUpdates,
        });

        // Retrieve 'Assigned to me' count based on recent search.
        this.props.fetchMyAssignmentsCount();
    }

    changeFilter(filterBy, orderByField, selectedDeskId = null) {
        const {
            searchQuery,
            loadAssignments,
            filterByType,
            filterByPriority,
            ignoreScheduledUpdates,
        } = this.props;

        loadAssignments({
            filterBy,
            searchQuery,
            orderByField,
            filterByType,
            filterByPriority,
            selectedDeskId,
            ignoreScheduledUpdates,
        });
    }

    changeSortField(field) {
        const {changeSortField, saveSortPreferences} = this.props;

        changeSortField(field, saveSortPreferences);
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
            privileges,
        } = this.props;

        // Show the Desk selection if we're in Fulfil Assignment or Custom Workspace
        const showDeskSelection = workspace === WORKSPACE.AUTHORING ||
            (workspace === WORKSPACE.ASSIGNMENTS && !currentDeskId);

        const showDeskAssignmentView = !!privileges.planning_assignments_desk;

        return (
            <React.Fragment>
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
                    changeFilter={this.changeFilter}
                    selectedDeskId={selectedDeskId}
                    userDesks={showDeskSelection ? userDesks : []}
                    selectAssignmentsFrom={this.selectAssignmentsFrom}
                    showDeskSelection={showDeskSelection}
                    showAllDeskOption={showAllDeskOption}
                    changeSortField={this.changeSortField}
                    showDeskAssignmentView={showDeskAssignmentView}
                />
            </React.Fragment>
        );
    }
}

AssignmentsSubNavComponent.propTypes = {
    filterBy: PropTypes.string,
    selectedDeskId: PropTypes.string,
    myAssignmentsCount: PropTypes.number,
    orderByField: PropTypes.string,
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
    changeSortField: PropTypes.func,
    saveSortPreferences: PropTypes.bool,
    ignoreScheduledUpdates: PropTypes.bool,
    privileges: PropTypes.object,
};

AssignmentsSubNavComponent.defaultProps = {
    showAllDeskOption: false,
    saveSortPreferences: true,
};

const mapStateToProps = (state) => ({
    filterBy: selectors.getFilterBy(state),
    selectedDeskId: selectors.getSelectedDeskId(state),
    currentDeskId: selectors.general.currentDeskId(state),
    myAssignmentsCount: selectors.getMyAssignmentsCount(state),
    orderByField: selectors.getOrderByField(state),

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

    privileges: selectors.general.privileges(state),

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
    changeSortField: (field, saveSortPreferences) => (
        dispatch(actions.assignments.ui.changeSortField(field, saveSortPreferences))
    ),
});

export const AssignmentsSubNav = connect(
    mapStateToProps,
    mapDispatchToProps
)(AssignmentsSubNavComponent);
