import React from 'react';
import {connect} from 'react-redux';

import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {WORKSPACE, ASSIGNMENTS} from '../../constants';

import {SubNavBar, FiltersBar} from '../../components/Assignments';
import {ArchiveItem} from '../../components/Archive';

interface IReduxStateProps {
    filterBy?: string;
    selectedDeskId?: string;
    currentDeskId?: string;
    myAssignmentsCount?: number;
    orderByField?: string;
    dayField?: string;
    searchQuery?: string;
    assignmentListSingleGroupView?: string;
    filterByType?: string;
    filterByPriority?: string;
    assignmentsInTodoCount?: number;
    assignmentsInInProgressCount?: number;
    assignmentsInCompletedCount?: number;
    assignmentCounts?: any;
    userDesks?: Array<any>;
    workspace?: string;
    listGroups?: Array<any>;
    privileges?: any;
}

interface IReduxDispatchProps {
    fetchMyAssignmentsCount?: () => any;
    changeAssignmentListSingleGroupView?: (groupKey: string) => any;
    loadAssignments: (filters: any) => any;
    changeSortField?: (field: string, saveSortPreferences?: boolean) => any;
    changeDayField?: (value: string) => any;
}

interface IOwnProps {
    archiveItem?: any;
    withArchiveItem?: boolean;
    showAllDeskOption?: boolean;
    saveSortPreferences?: boolean;
    ignoreScheduledUpdates?: boolean;
}

type IProps = IOwnProps & IReduxStateProps & IReduxDispatchProps;

export class AssignmentsSubNavComponent extends React.Component<IProps> {
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
            dayField,
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
            dayField,
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
        const {changeSortField, saveSortPreferences = true} = this.props;

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
            dayField,
            searchQuery,
            assignmentListSingleGroupView,
            changeAssignmentListSingleGroupView,
            withArchiveItem,
            archiveItem,
            selectedDeskId,
            workspace,
            userDesks,
            currentDeskId,
            showAllDeskOption = false,
            privileges,
            changeDayField,
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
                    dayField={dayField}
                    changeDayField={changeDayField}
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

const mapStateToProps = (state) => ({
    filterBy: selectors.getFilterBy(state),
    selectedDeskId: selectors.getSelectedDeskId(state),
    currentDeskId: selectors.general.currentDeskId(state),
    myAssignmentsCount: selectors.getMyAssignmentsCount(state),
    orderByField: selectors.getOrderByField(state),
    dayField: selectors.getDayField(state),

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
    changeDayField: (value) => dispatch(actions.assignments.ui.changeDayField(value)),
    changeSortField: (field, saveSortPreferences) => (
        dispatch(actions.assignments.ui.changeSortField(field, saveSortPreferences))
    ),
});

export const AssignmentsSubNav = connect<IReduxStateProps, IReduxDispatchProps, IOwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(AssignmentsSubNavComponent);
