import React from 'react'
import PropTypes from 'prop-types'
import { AssignmentItem } from '../index'
import { InfiniteLoader, List, AutoSizer } from 'react-virtualized'
import { LIST_ITEM_2_LINES_HEIGHT } from '../../constants'
import './style.scss'

export class AssignmentList extends React.Component {

    constructor(props) {
        super(props)
        this.state = { isNextPageLoading: false }
    }

    getRowHeight({ index }) {
        const isLast = this.props.assignments.length === index + 1
        let height = LIST_ITEM_2_LINES_HEIGHT

        if (isLast) {
            height += 3
        }
        return height
    }

    isRowLoaded({ index }) {
        return index <= this.props.assignments.length
    }

    loadMoreRows() {
        const { loadMoreAssignments } = this.props
        const { isNextPageLoading } = this.state

        if (isNextPageLoading) {
            Promise.resolve()
        } else {
            this.setState({ isNextPageLoading: true })
            return loadMoreAssignments()
            .then(() => this.setState({ isNextPageLoading: false }))
        }
    }

    rowRenderer({ index, key, style }) {
        const assignment = this.props.assignments[index]
        const { users, session } = this.props
        const assignedUser = users.find((user) => assignment.planning.assigned_to && user._id === assignment.planning.assigned_to.user)
        const isCurrentUser = assignedUser && assignedUser._id === session.identity._id

        return (
            <div key={key} style={style} className="Assignments-list__group">
                <AssignmentItem
                    key={assignment._id}
                    assignment={assignment}
                    isSelected={this.props.selectedAssignments.indexOf(assignment._id) > -1}
                    onClick={this.props.onClick}
                    onDoubleClick={this.props.onDoubleClick}
                    onSelectChange={(value) => this.props.onSelectChange({
                        assignment: assignment._id,
                        value,
                    })}
                    assignedUser={assignedUser}
                    isCurrentUser={isCurrentUser}
                />
            </div>
        )
    }

    render() {
        const { assignments } = this.props
        return (
            <div className="assignments-list">
                <div className="assignments-list__title">
                    <span>To Do</span>
                    <span className="badge">{assignments.length}</span>
                </div>
                <InfiniteLoader
                    isRowLoaded={this.isRowLoaded.bind(this)}
                    loadMoreRows={this.loadMoreRows.bind(this)}
                    rowCount={assignments.length + 20}
                >
                    {({ onRowsRendered, registerChild }) => (
                        <AutoSizer>
                            {({ height, width }) => (
                                <List
                                    ref={registerChild}
                                    onRowsRendered={onRowsRendered}
                                    rowRenderer={this.rowRenderer.bind(this)}
                                    height={height}
                                    width={width}
                                    assignments={assignments}
                                    rowCount={assignments.length}
                                    rowHeight={this.getRowHeight.bind(this)}
                                />
                            )}
                        </AutoSizer>
                    )}
                </InfiniteLoader>
                { !assignments || assignments.length === 0 &&
                    <p className="assignments-list__empty-msg">There is no assignment yet</p>
                }
            </div>
        )
    }
}

AssignmentList.propTypes = {
    assignments: PropTypes.array.isRequired,
    users: PropTypes.array,
    session: PropTypes.object,
    selectedAssignments: PropTypes.array.isRequired,
    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func,
    onSelectChange: PropTypes.func.isRequired,
    loadMoreAssignments: PropTypes.func.isRequired,
}
