import React from 'react'
import PropTypes from 'prop-types'
import { SearchBar } from '../index'

export class AssignmentListHeader extends React.Component {

    render() {
        const {
                searchQuery,
                createAssignment,
                changeSearchQuery,
                privileges,
        } = this.props

        return (
            <div className="Assignments-list-container__header subnav">
                <SearchBar value={searchQuery} onSearch={(searchQuery) => changeSearchQuery(searchQuery)}/>
                <h3 className="subnav__page-title">
                    <span>
                        <span>Assignments</span>
                    </span>
                </h3>
                {privileges.planning === 1 && (
                    <div className="subnav__button-stack--square-buttons">
                        <div className="navbtn" title="Create Assignment">
                            <button type="button" className="btn btn--icon-only-circle" onClick={createAssignment}>
                                <i className="icon-plus-large"/>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )
    }
}

AssignmentListHeader.propTypes = {
    searchQuery: PropTypes.string,
    privileges: PropTypes.object,
    createAssignment: PropTypes.func.isRequired,
    changeSearchQuery: PropTypes.func.isRequired,
}
