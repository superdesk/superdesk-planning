import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classNames from 'classnames'
import {
    AssignmentList,
    AssignmentListHeader,
    AssignmentListSearchHeader,
    EditAssignmentPanelContainer,
} from '../index'
import * as selectors from '../../selectors'
import * as actions from '../../actions'
import './style.scss'


class AssignmentListComponent extends React.Component {

    changeSearchQuery(searchQuery) {
        const {
            filterBy,
            orderByField,
            orderDirection,
            loadAssignments,
            filterByState,
            filterByType,
        } = this.props

        loadAssignments(filterBy, searchQuery, orderByField, orderDirection, filterByState, filterByType)
    }

    changeFilter (filterBy, orderByField, orderDirection) {
        const { searchQuery, loadAssignments, filterByState, filterByType } = this.props

        loadAssignments(filterBy, searchQuery, orderByField, orderDirection, filterByState, filterByType)
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
                        onClick={this.props.preview}
                        onSelectChange={this.props.onAssignmentSelectChange}
                    />
                    {this.props.previewOpened && <EditAssignmentPanelContainer
                        onFulFilAssignment={this.props.onFulFilAssignment}/> }
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
    myAssignmentsCount: PropTypes.number,
    session: PropTypes.object,
    users: PropTypes.array,
    selectedAssignments: PropTypes.array.isRequired,
    previewOpened: PropTypes.bool,
    preview: PropTypes.func,
    onAssignmentSelectChange: PropTypes.func.isRequired,
    loadAssignments: PropTypes.func.isRequired,
    loadMoreAssignments: PropTypes.func.isRequired,
    assignments: PropTypes.array,
    onFulFilAssignment: PropTypes.func,
    filterByState: PropTypes.string,
    filterByType: PropTypes.string,
}

const mapStateToProps = (state) => ({
    filterBy: selectors.getFilterBy(state),
    filterByState: selectors.getAssignmentFilterByState(state),
    filterByType: selectors.getAssignmentFilterByType(state),
    searchQuery: selectors.getSearchQuery(state),
    orderByField: selectors.getOrderByField(state),
    orderDirection: selectors.getOrderDirection(state),
    myAssignmentsCount: selectors.getMyAssignmentsCount(state),
    selectedAssignments: selectors.getSelectedAssignments(state),
    previewOpened: selectors.getPreviewAssignmentOpened(state),
    session: selectors.getSessionDetails(state),
    users: selectors.getUsers(state),
    assignments: selectors.getAssignments(state),
})

const mapDispatchToProps = (dispatch) => ({
    loadAssignments: (filterBy, searchQuery, orderByField,
                      orderDirection, filterByState, filterByType) =>
        dispatch(actions.assignments.ui.loadAssignments(
            filterBy, searchQuery, orderByField, orderDirection, filterByState, filterByType
        )),
    loadMoreAssignments: () => dispatch(actions.assignments.ui.loadMoreAssignments()),
    preview: (assignment) => dispatch(actions.assignments.ui.preview(assignment)),
    onAssignmentSelectChange: (value) => dispatch(actions.assignments.ui.toggleAssignmentSelection(value)),
})

export const AssignmentListContainer = connect(mapStateToProps, mapDispatchToProps)(AssignmentListComponent)
