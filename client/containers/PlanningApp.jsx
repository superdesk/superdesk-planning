import React from 'react'
import { connect } from 'react-redux'
import {
    EventsListPanelContainer,
    PlanningPanelContainer,
    AddEventContainer,
    EditPlanningPanelContainer,
    CreateAgendaContainer } from './index'

const PlanningAppComponent = ({ editPlanningViewOpen }) => {
    let classes = ['Planning']
    if (editPlanningViewOpen) {
        classes.push('Planning--edit-planning-view')
    }

    return (
        <div className={classes.join(' ')}>
            <CreateAgendaContainer />
            <AddEventContainer />
            <EventsListPanelContainer />
            <PlanningPanelContainer />
            {editPlanningViewOpen && <EditPlanningPanelContainer />}
        </div>
    )
}

PlanningAppComponent.propTypes = {
    editPlanningViewOpen: React.PropTypes.bool,
}

const mapStateToProps = (state) => ({
    editPlanningViewOpen: state.planning.editorOpened
})

export const PlanningApp = connect(mapStateToProps)(PlanningAppComponent)
