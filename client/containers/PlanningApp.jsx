import React from 'react'
import { connect } from 'react-redux'
import {
    EventsListPanelContainer,
    PlanningPanelContainer,
    AddEventContainer,
    CreateAgendaContainer } from './index'

const PlanningAppComponent = ({ editPlanningViewOpen, advancedSearchViewOpen, showEvents }) => {
    const classes = [
        'Planning',
        editPlanningViewOpen ? 'Planning--edit-planning-view' : null,
        advancedSearchViewOpen ? 'Planning--advanced-search-view' : null,
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
    editPlanningViewOpen: React.PropTypes.bool,
    advancedSearchViewOpen: React.PropTypes.bool,
    showEvents: React.PropTypes.bool,
}

const mapStateToProps = (state) => ({
    showEvents: state.events.show,
    editPlanningViewOpen: state.planning.editorOpened,
    advancedSearchViewOpen: state.planning.advancedSearchOpened
})

export const PlanningApp = connect(mapStateToProps)(PlanningAppComponent)
