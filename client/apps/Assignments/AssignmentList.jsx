import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {isNil} from 'lodash';

import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {ASSIGNMENTS, WORKSPACE} from '../../constants';

import {AssignmentGroupList} from '../../components/Assignments';

export const AssignmentListContainer = ({
    assignmentListSingleGroupView,
    changeAssignmentListSingleGroupView,
    inAuthoring,
    loadAssignments,
    loadMoreAssignments,
    filterBy,
    searchQuery,
    orderByField,
    orderDirection,
    filterByType,
    filterByPriority,
}) => {
    const loadAssignmentsForGroup = (groupKey) =>
        loadAssignments(
            filterBy,
            searchQuery,
            orderByField,
            orderDirection,
            ASSIGNMENTS.LIST_GROUPS[groupKey].states,
            filterByType,
            filterByPriority
        );

    return (
        <div className="sd-column-box__main-column__items">
            {isNil(assignmentListSingleGroupView) ? (
                Object.keys(ASSIGNMENTS.LIST_GROUPS).map((groupKey) => (
                    <AssignmentGroupList
                        key={groupKey}
                        groupKey={groupKey}
                        loadAssignmentsForGroup={loadAssignmentsForGroup}
                        loadMoreAssignments={loadMoreAssignments}
                        inAuthoring={inAuthoring}
                        changeAssignmentListSingleGroupView={
                            changeAssignmentListSingleGroupView.bind(null, groupKey)
                        }
                    />
                ))
            ) : (
                <AssignmentGroupList
                    groupKey={assignmentListSingleGroupView}
                    loadAssignmentsForGroup={loadAssignmentsForGroup}
                    loadMoreAssignments={loadMoreAssignments}
                    inAuthoring={inAuthoring}
                    changeAssignmentListSingleGroupView={
                        changeAssignmentListSingleGroupView.bind(this, assignmentListSingleGroupView)
                    }
                />
            )}
        </div>
    );
};

AssignmentListContainer.propTypes = {
    assignmentListSingleGroupView: PropTypes.string,
    changeAssignmentListSingleGroupView: PropTypes.func,
    inAuthoring: PropTypes.bool,
    loadAssignments: PropTypes.func.isRequired,
    loadMoreAssignments: PropTypes.func.isRequired,
    filterBy: PropTypes.string,
    filterByType: PropTypes.string,
    filterByPriority: PropTypes.string,
    searchQuery: PropTypes.string,
    orderByField: PropTypes.string,
    orderDirection: PropTypes.string,
};

const mapStateToProps = (state) => ({
    assignmentListSingleGroupView: selectors.getAssignmentListSingleGroupView(state),
    inAuthoring: selectors.getCurrentWorkspace(state) === WORKSPACE.AUTHORING,
    filterBy: selectors.getFilterBy(state),
    filterByType: selectors.getAssignmentFilterByType(state),
    filterByPriority: selectors.getAssignmentFilterByPriority(state),
    searchQuery: selectors.getSearchQuery(state),
    orderByField: selectors.getOrderByField(state),
    orderDirection: selectors.getOrderDirection(state),
});

const mapDispatchToProps = (dispatch) => ({
    changeAssignmentListSingleGroupView: (groupKey) => dispatch(
        actions.assignments.ui.changeAssignmentListSingleGroupView(groupKey)
    ),
    loadMoreAssignments: (states) => dispatch(
        actions.assignments.ui.loadMoreAssignments(states)
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

export const AssignmentList = connect(
    mapStateToProps,
    mapDispatchToProps
)(AssignmentListContainer);
