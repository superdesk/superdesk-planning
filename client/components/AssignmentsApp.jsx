import React from 'react'
import { connect } from 'react-redux'
import { AssignmentListContainer, ModalsContainer } from './index'

const AssignmentsAppComponent = () => {
    return (
        <div className="AssignmentsApp">
            <AssignmentListContainer />
            <ModalsContainer />
        </div>
    )
}

AssignmentsAppComponent.propTypes = { }

export const AssignmentsApp = connect(null)(AssignmentsAppComponent)
