import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { AssignmentList, AssignmentListHeader, AssignmentListSearchHeader, EditAssignmentContainer } from '../index'
import * as selectors from '../../selectors'
import * as actions from '../../actions'
import './style.scss'

class AssignmentListComponent extends React.Component {

    changeSearchQuery(searchQuery) {
        const { filterBy, orderByField, orderDirection, loadAssignments } = this.props

        loadAssignments(filterBy, searchQuery, orderByField, orderDirection)
    }

    changeFilter (filterBy, orderByField, orderDirection) {
        const { searchQuery, loadAssignments } = this.props

        loadAssignments(filterBy, searchQuery, orderByField, orderDirection)
    }

    render() {
        return (
            <div className={classNames('Assignments-list-container',
                  this.props.previewOpened ? 'Assignments-list-container__body--edit-assignment-view' : null
                )}>
                <AssignmentListHeader
                    searchQuery={this.props.searchQuery}
                    changeSearchQuery={this.changeSearchQuery.bind(this)}
                />
                <AssignmentListSearchHeader
                    filterBy={this.props.filterBy}
                    myAssignmentsCount={this.props.myAssignmentsCount}
                    orderByField={this.props.orderByField}
                    orderDirection={this.props.orderDirection}
                    changeFilter={this.changeFilter.bind(this)}
                />
                <div className="Assignments-list-container__body">
                    <AssignmentList
                        assignments={this.props.assignments}
                        loadMoreAssignments={this.props.loadMoreAssignments}
                        users={this.props.users}
                        session={this.props.session}
                        selectedAssignments={this.props.selectedAssignments}
                        onClick={this.props.previewAssignment}
                        onSelectChange={this.props.onAssignmentSelectChange}
                    />
                    {this.props.previewOpened && <EditAssignmentContainer /> }
                </div>
            </div>
        )
    }
}

AssignmentListComponent.propTypes = {
    filterBy: PropTypes.string,
    searchQuery: PropTypes.string,
    orderByField: PropTypes.string,
    orderDirection: PropTypes.string,
    assignments: PropTypes.array,
    myAssignmentsCount: PropTypes.number,
    session: PropTypes.object,
    users: PropTypes.array,
    selectedAssignments: PropTypes.array.isRequired,
    previewOpened: PropTypes.bool,
    previewAssignment: PropTypes.func,
    onAssignmentSelectChange: PropTypes.func.isRequired,
    loadAssignments: PropTypes.func.isRequired,
    loadMoreAssignments: PropTypes.func.isRequired,
}

const mapStateToProps = (state) => ({
    filterBy: selectors.getFilterBy(state),
    searchQuery: selectors.getSearchQuery(state),
    orderByField: selectors.getOrderByField(state),
    orderDirection: selectors.getOrderDirection(state),
    assignments: selectors.getAssignments(state),
    myAssignmentsCount: selectors.getMyAssignmentsCount(state),
    selectedAssignments: selectors.getSelectedAssignments(state),
    previewOpened: selectors.getPreviewAssignmentOpened(state),
    session: selectors.getSessionDetails(state),
    users: selectors.getUsers(state),
})

const mapDispatchToProps = (dispatch) => ({
    loadAssignments: (filterBy, searchQuery, orderByField, orderDirection) =>
        dispatch(actions.loadAssignments(filterBy, searchQuery, orderByField, orderDirection)),
    loadMoreAssignments: () => dispatch(actions.loadMoreAssignments()),
    previewAssignment: (assignment) => dispatch(actions.previewAssignment(assignment)),
    onAssignmentSelectChange: (value) => dispatch(actions.toggleAssignmentSelection(value)),
})

export const AssignmentListContainer = connect(mapStateToProps, mapDispatchToProps)(AssignmentListComponent)
