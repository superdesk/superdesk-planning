import React from 'react'
import { connect } from 'react-redux'
import {
    EventsListPanelContainer,
    PlanningPanelContainer,
    AddEventContainer,
    CreateAgendaContainer } from './index'

const PlanningAppComponent = ({ showEvents }) => {
    const classes = [
        'Planning',
        showEvents ? 'Planning--show-events' : null,
    ]
    return (
        <div className={classes.join(' ')}>
            <CreateAgendaContainer />
            <AddEventContainer />
            <EventsListPanelContainer />
            <PlanningPanelContainer />
        </div>
    )
}

PlanningAppComponent.propTypes = {
    showEvents: React.PropTypes.bool
}

const mapStateToProps = (state) => ({
    showEvents: state.events.show,
})

export const PlanningApp = connect(mapStateToProps)(PlanningAppComponent)
