import React from 'react'
import { connect } from 'react-redux'
import {
    EventsPanelContainer,
    PlanningPanelContainer,
    CreateAgendaContainer } from './index'

const PlanningAppComponent = ({ showEvents }) => {
    const classes = [
        'Planning',
        showEvents ? null : 'Planning--hide-events',
    ]
    return (
        <div className={classes.join(' ')}>
            <CreateAgendaContainer />
            <EventsPanelContainer />
            <PlanningPanelContainer />
        </div>
    )
}

PlanningAppComponent.propTypes = { showEvents: React.PropTypes.bool }

const mapStateToProps = (state) => ({ showEvents: state.events.show })

export const PlanningApp = connect(mapStateToProps)(PlanningAppComponent)
