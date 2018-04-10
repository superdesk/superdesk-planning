import React from 'react';
import PropTypes from 'prop-types';

import {ASSIGNMENTS} from '../../constants';
import {gettext} from '../../utils';

import {SubNav} from '../UI/SubNav';
import {SearchBar} from '../UI';

export const SubNavBar = ({
    searchQuery,
    changeSearchQuery,
    assignmentListSingleGroupView,
    changeAssignmentListSingleGroupView,
    totalCountInListView,
    onlyTodoAssignments,
}) => (
    <SubNav>
        {!onlyTodoAssignments && assignmentListSingleGroupView &&
            <div className="Assignments-list-container__header__backButton">
                <div className="navbtn" title="Back to group list view">
                    <button
                        type="button"
                        className="backlink"
                        onClick={changeAssignmentListSingleGroupView}
                    />
                </div>
            </div>
        }
        <SearchBar
            value={searchQuery}
            onSearch={changeSearchQuery}
        />
        <h3 className="subnav__page-title">
            <span>
                <span>{gettext('Assignments')}</span>
                {assignmentListSingleGroupView && (
                    <span>
                        <span>{'/' + ASSIGNMENTS.LIST_GROUPS[assignmentListSingleGroupView].label}</span>
                        <span className="badge">{totalCountInListView}</span>
                    </span>
                )}
            </span>
        </h3>
    </SubNav>
);

SubNavBar.propTypes = {
    searchQuery: PropTypes.string,
    changeSearchQuery: PropTypes.func,
    assignmentListSingleGroupView: PropTypes.string,
    changeAssignmentListSingleGroupView: PropTypes.func,
    totalCountInListView: PropTypes.number,
    onlyTodoAssignments: PropTypes.bool,
};
