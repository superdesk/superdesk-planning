import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import classNames from 'classnames';
import {isNil} from 'lodash';
import {
    AssignmentList,
    AssignmentListHeader,
    AssignmentListSearchHeader,
    AssignmentPanelContainer,
} from '../index';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {ASSIGNMENTS, WORKSPACE} from '../../constants';
import './style.scss';

export class AssignmentListContainerComponent extends React.Component {
    constructor(props) {
        super(props);
        this.changeSearchQuery = this.changeSearchQuery.bind(this);
        this.changeFilter = this.changeFilter.bind(this);
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

        Object.keys(ASSIGNMENTS.LIST_GROUPS).forEach((groupKey) => {
            loadAssignments(filterBy, searchQuery, orderByField, orderDirection,
                ASSIGNMENTS.LIST_GROUPS[groupKey].states, filterByType, filterByPriority);
        });
    }

    changeFilter(filterBy, orderByField, orderDirection) {
        const {searchQuery, loadAssignments, filterByType, filterByPriority} = this.props;

        Object.keys(ASSIGNMENTS.LIST_GROUPS).forEach((groupKey) => {
            loadAssignments(filterBy, searchQuery, orderByField, orderDirection,
                ASSIGNMENTS.LIST_GROUPS[groupKey].states, filterByType, filterByPriority);
        });
    }

    loadAssignmentsForGroup(groupKey) {
        const {
            filterBy,
            searchQuery,
            orderByField,
            orderDirection,
            loadAssignments,
            filterByType,
            filterByPriority,
        } = this.props;

        const filterByState = ASSIGNMENTS.LIST_GROUPS[groupKey].states;

        loadAssignments(filterBy, searchQuery, orderByField, orderDirection, filterByState,
            filterByType, filterByPriority);
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
            changeAssignmentListSingleGroupView,
            assignmentListSingleGroupView,
            inAuthoring,
            previewOpened,
        } = this.props;

        return (
            <div className={classNames(
                'Assignments-list-container',
                {'open-preview': previewOpened},
                {
                    'Assignments-list-container__body--edit-in-authoring': previewOpened && inAuthoring,
                })}>
                <AssignmentListHeader
                    searchQuery={this.props.searchQuery}
                    changeSearchQuery={this.changeSearchQuery.bind(this)}
                    assignmentListSingleGroupView={!inAuthoring && assignmentListSingleGroupView}
                    changeAssignmentListSingleGroupView={changeAssignmentListSingleGroupView.bind(this, null)}
                    totalCountInListView={this.getTotalCountForListGroup(assignmentListSingleGroupView)}
                />
                <AssignmentListSearchHeader
                    filterBy={this.props.filterBy}
                    myAssignmentsCount={this.props.myAssignmentsCount}
                    orderByField={this.props.orderByField}
                    orderDirection={this.props.orderDirection}
                    changeFilter={this.changeFilter.bind(this)}
                />
                {isNil(assignmentListSingleGroupView) && (
                    <div className={ classNames('Assignments-list-container__groups',
                        {'Assignments-list-container__groups--edit-view': this.props.previewOpened}) }>
                        { Object.keys(ASSIGNMENTS.LIST_GROUPS).map((groupKey) => (<div key={groupKey}>
                            <AssignmentList
                                groupKey={groupKey}
                                loadAssignmentsForGroup={this.loadAssignmentsForGroup.bind(this)}
                                loadMoreAssignments={this.props.loadMoreAssignments}
                                changeAssignmentListSingleGroupView={changeAssignmentListSingleGroupView.bind(
                                    this, groupKey)}
                                inAuthoring={inAuthoring}
                            />
                        </div>)) }
                    </div>
                )}
                {!isNil(assignmentListSingleGroupView) && (
                    <div className={
                        classNames('Assignments-list-container__groups',
                            {
                                'Assignments-list-container__groups--edit-view': previewOpened && !inAuthoring,
                            })}>
                        <AssignmentList
                            groupKey={assignmentListSingleGroupView}
                            loadAssignmentsForGroup={this.loadAssignmentsForGroup.bind(this)}
                            loadMoreAssignments={this.props.loadMoreAssignments}
                            changeAssignmentListSingleGroupView={changeAssignmentListSingleGroupView.bind(
                                this, assignmentListSingleGroupView)}
                            inAuthoring={inAuthoring}
                        />
                    </div>
                )

                }
                <AssignmentPanelContainer
                    previewOpened={previewOpened}
                    inAuthoring={inAuthoring}
                />
            </div>
        );
    }
}

AssignmentListContainerComponent.propTypes = {
    filterBy: PropTypes.string,
    searchQuery: PropTypes.string,
    orderByField: PropTypes.string,
    orderDirection: PropTypes.string,
    myAssignmentsCount: PropTypes.number,
    previewOpened: PropTypes.bool,
    loadAssignments: PropTypes.func.isRequired,
    loadMoreAssignments: PropTypes.func.isRequired,
    filterByType: PropTypes.string,
    filterByPriority: PropTypes.string,
    assignmentListSingleGroupView: PropTypes.string,
    changeAssignmentListSingleGroupView: PropTypes.func,
    assignmentsInTodoCount: PropTypes.number,
    assignmentsInInProressCount: PropTypes.number,
    assignmentsInCompletedCount: PropTypes.number,
    inAuthoring: PropTypes.bool,
};

const mapStateToProps = (state) => ({
    filterBy: selectors.getFilterBy(state),
    filterByType: selectors.getAssignmentFilterByType(state),
    filterByPriority: selectors.getAssignmentFilterByPriority(state),
    searchQuery: selectors.getSearchQuery(state),
    orderByField: selectors.getOrderByField(state),
    orderDirection: selectors.getOrderDirection(state),
    myAssignmentsCount: selectors.getMyAssignmentsCount(state),
    previewOpened: selectors.getPreviewAssignmentOpened(state),
    assignmentListSingleGroupView: selectors.getAssignmentListSingleGroupView(state),
    assignmentsInTodoCount: selectors.getAssignmentsToDoListCount(state),
    assignmentsInInProressCount: selectors.getAssignmentsInProgressListCount(state),
    assignmentsInCompletedCount: selectors.getAssignmentsCompletedListCount(state),
    inAuthoring: selectors.getCurrentWorkspace(state) === WORKSPACE.AUTHORING,
});

const mapDispatchToProps = (dispatch) => ({
    loadAssignments: (filterBy, searchQuery, orderByField,
        orderDirection, filterByState, filterByType, filterByPriority) =>
        dispatch(actions.assignments.ui.loadAssignments(
            filterBy, searchQuery, orderByField, orderDirection, filterByState,
            filterByType, filterByPriority
        )),
    loadMoreAssignments: (states) => dispatch(actions.assignments.ui.loadMoreAssignments(states)),
    preview: (assignment) => dispatch(actions.assignments.ui.preview(assignment)),
    reassign: (assignment) => dispatch(actions.assignments.ui.reassign(assignment)),
    completeAssignment: (assignment) => dispatch(actions.assignments.ui.complete(assignment)),
    editAssignmentPriority: (assignment) => dispatch(actions.assignments.ui.editPriority(assignment)),
    startWorking: (assignment) => dispatch(actions.assignments.ui.openSelectTemplateModal(assignment)),
    changeAssignmentListSingleGroupView: (groupKey) =>
        dispatch(actions.assignments.ui.changeAssignmentListSingleGroupView(groupKey)),
});

export const AssignmentListContainer = connect(mapStateToProps, mapDispatchToProps)(AssignmentListContainerComponent);
