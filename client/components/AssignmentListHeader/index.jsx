import React from 'react';
import PropTypes from 'prop-types';
import {SearchBar} from '../UI';
import {ASSIGNMENTS} from '../../constants';

export class AssignmentListHeader extends React.Component {
    render() {
        const {
            searchQuery,
            changeSearchQuery,
            assignmentListSingleGroupView,
            changeAssignmentListSingleGroupView,
            totalCountInListView,
        } = this.props;

        return (
            <div className="Assignments-list-container__header subnav">
                {assignmentListSingleGroupView &&
                    <div className="Assignments-list-container__header__backButton">
                        <div className="navbtn" title="Back to group list view">
                            <button onClick={changeAssignmentListSingleGroupView} type="button" className="backlink" />
                        </div>
                    </div>
                }
                <SearchBar value={searchQuery} onSearch={(searchQuery) => changeSearchQuery(searchQuery)}/>
                <h3 className="subnav__page-title">
                    <span>
                        <span>Assignments</span>
                        {assignmentListSingleGroupView && (
                            <span>
                                <span>{'/' + ASSIGNMENTS.LIST_GROUPS[assignmentListSingleGroupView].label}</span>
                                <span className="badge">{totalCountInListView}</span>
                            </span>
                        )}
                    </span>
                </h3>
            </div>
        );
    }
}

AssignmentListHeader.propTypes = {
    searchQuery: PropTypes.string,
    changeSearchQuery: PropTypes.func.isRequired,
    assignmentListSingleGroupView: PropTypes.string,
    changeAssignmentListSingleGroupView: PropTypes.func,
    totalCountInListView: PropTypes.number,
};
