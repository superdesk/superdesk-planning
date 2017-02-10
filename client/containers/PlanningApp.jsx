import React from 'react'
import { connect } from 'react-redux'
import {
    EventsListPanelContainer,
    PlanningPanelContainer,
    AddEventContainer,
    EditPlanningPanelContainer,
    CreateAgendaContainer } from './index'

const PlanningAppComponent = ({ editPlanningViewOpen, showEvents }) => {
    const classes = [
        'Planning',
        editPlanningViewOpen ? 'Planning--edit-planning-view' : null,
        showEvents ? 'Planning--show-events' : null,
    ]
    return (
        <div className={classes.join(' ')}>
            <CreateAgendaContainer />
            <AddEventContainer />
            <EventsListPanelContainer />
            <PlanningPanelContainer />
            <EditPlanningPanelContainer />
        </div>
    )
}

PlanningAppComponent.propTypes = {
    editPlanningViewOpen: React.PropTypes.bool,
    showEvents: React.PropTypes.bool,
}

const mapStateToProps = (state) => ({
    showEvents: state.events.show,
    editPlanningViewOpen: state.planning.editorOpened
})

export const PlanningApp = connect(mapStateToProps)(PlanningAppComponent)
