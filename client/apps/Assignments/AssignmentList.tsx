import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {isNil} from 'lodash';

import {superdeskApi} from '../../superdeskApi';

import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {ASSIGNMENTS} from '../../constants';

import {AssignmentGroupList} from '../../components/Assignments';

export const AssignmentListContainer = ({
    assignmentListSingleGroupView,
    changeAssignmentListSingleGroupView,
    setMaxHeight,
    hideItemActions,
    loadMoreAssignments,
    contentTypes,
    listGroups,
    saveSortPreferences,
}) => {
    const {gettext} = superdeskApi.localization;
    const listProps = {
        loadMoreAssignments,
        setMaxHeight,
        hideItemActions,
        contentTypes,
        saveSortPreferences,
    };

    return (
        <div className="sd-column-box__main-column__items">
            {isNil(assignmentListSingleGroupView) ? (
                listGroups.map((groupKey) => (
                    <AssignmentGroupList
                        key={groupKey}
                        groupKey={groupKey}
                        groupLabel={gettext(ASSIGNMENTS.LIST_GROUPS[groupKey].label)}
                        groupStates={ASSIGNMENTS.LIST_GROUPS[groupKey].states}
                        groupEmptyMessage={ASSIGNMENTS.LIST_GROUPS[groupKey].emptyMessage}
                        changeAssignmentListSingleGroupView={
                            changeAssignmentListSingleGroupView.bind(null, groupKey)
                        }
                        {...listProps}
                    />
                ))
            ) : (
                <AssignmentGroupList
                    groupKey={assignmentListSingleGroupView}
                    groupLabel={gettext(ASSIGNMENTS.LIST_GROUPS[assignmentListSingleGroupView].label)}
                    groupStates={ASSIGNMENTS.LIST_GROUPS[assignmentListSingleGroupView].states}
                    groupEmptyMessage={ASSIGNMENTS.LIST_GROUPS[assignmentListSingleGroupView].emptyMessage}
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
    loadMoreAssignments: PropTypes.func.isRequired,
    hideItemActions: PropTypes.bool,
    contentTypes: PropTypes.array,
    listGroups: PropTypes.arrayOf(PropTypes.string),
    saveSortPreferences: PropTypes.bool,
};

AssignmentListContainer.defaultProps = {
    setMaxHeight: true,
    saveSortPreferences: true,
};

const mapStateToProps = (state) => ({
    assignmentListSingleGroupView: selectors.getAssignmentListSingleGroupView(state),
    contentTypes: selectors.general.contentTypes(state),
    listGroups: selectors.getAssignmentGroups(state),
});

const mapDispatchToProps = (dispatch) => ({
    changeAssignmentListSingleGroupView: (groupKey) => dispatch(
        actions.assignments.ui.changeAssignmentListSingleGroupView(groupKey)
    ),
    loadMoreAssignments: (groupKey) => dispatch(
        actions.assignments.ui.loadMoreAssignments(groupKey)
    ),
});

export const AssignmentList = connect(
    mapStateToProps,
    mapDispatchToProps
)(AssignmentListContainer);
