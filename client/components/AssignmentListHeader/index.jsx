import React from 'react'
import PropTypes from 'prop-types'
import { SearchBar } from '../index'

export class AssignmentListHeader extends React.Component {

    render() {
        const {
            searchQuery,
            changeSearchQuery,
        } = this.props

        return (
            <div className="Assignments-list-container__header subnav">
                <SearchBar value={searchQuery} onSearch={(searchQuery) => changeSearchQuery(searchQuery)}/>
                <h3 className="subnav__page-title">
                    <span>
                        <span>Assignments</span>
                    </span>
                </h3>
            </div>
        )
    }
}

AssignmentListHeader.propTypes = {
    searchQuery: PropTypes.string,
    changeSearchQuery: PropTypes.func.isRequired,
}
