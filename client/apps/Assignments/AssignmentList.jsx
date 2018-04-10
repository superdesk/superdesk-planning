import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {isNil} from 'lodash';

import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {ASSIGNMENTS} from '../../constants';

import {AssignmentGroupList} from '../../components/Assignments';

export const AssignmentListContainer = ({
    assignmentListSingleGroupView,
    changeAssignmentListSingleGroupView,
    setMaxHeight,
    hideItemActions,
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

    const listProps = {
        loadAssignmentsForGroup,
        loadMoreAssignments,
        setMaxHeight,
        hideItemActions,
    };

    return (
        <div className="sd-column-box__main-column__items">
            {isNil(assignmentListSingleGroupView) ? (
                Object.keys(ASSIGNMENTS.LIST_GROUPS).map((groupKey) => (
                    <AssignmentGroupList
                        key={groupKey}
                        groupKey={groupKey}
                        changeAssignmentListSingleGroupView={
                            changeAssignmentListSingleGroupView.bind(null, groupKey)
                        }
                        {...listProps}
                    />
                ))
            ) : (
                <AssignmentGroupList
                    groupKey={assignmentListSingleGroupView}
                    changeAssignmentListSingleGroupView={
                        changeAssignmentListSingleGroupView.bind(this, assignmentListSingleGroupView)
                    }
                    {...listProps}
                />
            )}
        </div>
    );
};

AssignmentListContainer.propTypes = {
    assignmentListSingleGroupView: PropTypes.string,
    changeAssignmentListSingleGroupView: PropTypes.func,
    setMaxHeight: PropTypes.bool,
    loadAssignments: PropTypes.func.isRequired,
    loadMoreAssignments: PropTypes.func.isRequired,
    filterBy: PropTypes.string,
    filterByType: PropTypes.string,
    filterByPriority: PropTypes.string,
    searchQuery: PropTypes.string,
    orderByField: PropTypes.string,
    orderDirection: PropTypes.string,
    hideItemActions: PropTypes.bool,
};

AssignmentListContainer.defaultProps = {setMaxHeight: true};

const mapStateToProps = (state) => ({
    assignmentListSingleGroupView: selectors.getAssignmentListSingleGroupView(state),
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
